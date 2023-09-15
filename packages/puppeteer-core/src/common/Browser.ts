/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {type ChildProcess} from 'child_process';

import {type Protocol} from 'devtools-protocol';

import {
  Browser as BrowserBase,
  BrowserEvent,
  WEB_PERMISSION_TO_PROTOCOL_PERMISSION,
  type BrowserCloseCallback,
  type BrowserContextOptions,
  type IsPageTargetCallback,
  type Permission,
  type TargetFilterCallback,
} from '../api/Browser.js';
import {BrowserContext, BrowserContextEvent} from '../api/BrowserContext.js';
import {CDPSessionEvent} from '../api/CDPSession.js';
import {type Page} from '../api/Page.js';
import {type Target} from '../api/Target.js';
import {USE_TAB_TARGET} from '../environment.js';
import {assert} from '../util/assert.js';

import {type CdpCDPSession} from './CDPSession.js';
import {ChromeTargetManager} from './ChromeTargetManager.js';
import {type Connection} from './Connection.js';
import {FirefoxTargetManager} from './FirefoxTargetManager.js';
import {type Viewport} from './PuppeteerViewport.js';
import {
  DevToolsTarget,
  InitializationStatus,
  OtherTarget,
  PageTarget,
  WorkerTarget,
  type CdpTarget,
} from './Target.js';
import {TargetManagerEvent, type TargetManager} from './TargetManager.js';
import {TaskQueue} from './TaskQueue.js';

/**
 * @internal
 */
export class CdpBrowser extends BrowserBase {
  static async _create(
    product: 'firefox' | 'chrome' | undefined,
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback,
    targetFilterCallback?: TargetFilterCallback,
    isPageTargetCallback?: IsPageTargetCallback,
    waitForInitiallyDiscoveredTargets = true,
    useTabTarget = USE_TAB_TARGET
  ): Promise<CdpBrowser> {
    const browser = new CdpBrowser(
      product,
      connection,
      contextIds,
      ignoreHTTPSErrors,
      defaultViewport,
      process,
      closeCallback,
      targetFilterCallback,
      isPageTargetCallback,
      waitForInitiallyDiscoveredTargets,
      useTabTarget
    );
    await browser._attach();
    return browser;
  }
  #ignoreHTTPSErrors: boolean;
  #defaultViewport?: Viewport | null;
  #process?: ChildProcess;
  #connection: Connection;
  #closeCallback: BrowserCloseCallback;
  #targetFilterCallback: TargetFilterCallback;
  #isPageTargetCallback!: IsPageTargetCallback;
  #defaultContext: CdpBrowserContext;
  #contexts = new Map<string, CdpBrowserContext>();
  #screenshotTaskQueue: TaskQueue;
  #targetManager: TargetManager;

  override get _targets(): Map<string, CdpTarget> {
    return this.#targetManager.getAvailableTargets();
  }

  constructor(
    product: 'chrome' | 'firefox' | undefined,
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserCloseCallback,
    targetFilterCallback?: TargetFilterCallback,
    isPageTargetCallback?: IsPageTargetCallback,
    waitForInitiallyDiscoveredTargets = true,
    useTabTarget = USE_TAB_TARGET
  ) {
    super();
    product = product || 'chrome';
    this.#ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.#defaultViewport = defaultViewport;
    this.#process = process;
    this.#screenshotTaskQueue = new TaskQueue();
    this.#connection = connection;
    this.#closeCallback = closeCallback || function (): void {};
    this.#targetFilterCallback =
      targetFilterCallback ||
      ((): boolean => {
        return true;
      });
    this.#setIsPageTargetCallback(isPageTargetCallback);
    if (product === 'firefox') {
      this.#targetManager = new FirefoxTargetManager(
        connection,
        this.#createTarget,
        this.#targetFilterCallback
      );
    } else {
      this.#targetManager = new ChromeTargetManager(
        connection,
        this.#createTarget,
        this.#targetFilterCallback,
        waitForInitiallyDiscoveredTargets,
        useTabTarget
      );
    }
    this.#defaultContext = new CdpBrowserContext(this.#connection, this);
    for (const contextId of contextIds) {
      this.#contexts.set(
        contextId,
        new CdpBrowserContext(this.#connection, this, contextId)
      );
    }
  }

  #emitDisconnected = () => {
    this.emit(BrowserEvent.Disconnected, undefined);
  };

  override async _attach(): Promise<void> {
    this.#connection.on(CDPSessionEvent.Disconnected, this.#emitDisconnected);
    this.#targetManager.on(
      TargetManagerEvent.TargetAvailable,
      this.#onAttachedToTarget
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetGone,
      this.#onDetachedFromTarget
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetChanged,
      this.#onTargetChanged
    );
    this.#targetManager.on(
      TargetManagerEvent.TargetDiscovered,
      this.#onTargetDiscovered
    );
    await this.#targetManager.initialize();
  }

  override _detach(): void {
    this.#connection.off(CDPSessionEvent.Disconnected, this.#emitDisconnected);
    this.#targetManager.off(
      TargetManagerEvent.TargetAvailable,
      this.#onAttachedToTarget
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetGone,
      this.#onDetachedFromTarget
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetChanged,
      this.#onTargetChanged
    );
    this.#targetManager.off(
      TargetManagerEvent.TargetDiscovered,
      this.#onTargetDiscovered
    );
  }

  /**
   * The spawned browser process. Returns `null` if the browser instance was created with
   * {@link Puppeteer.connect}.
   */
  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  _targetManager(): TargetManager {
    return this.#targetManager;
  }

  #setIsPageTargetCallback(isPageTargetCallback?: IsPageTargetCallback): void {
    this.#isPageTargetCallback =
      isPageTargetCallback ||
      ((target: Target): boolean => {
        return (
          target.type() === 'page' ||
          target.type() === 'background_page' ||
          target.type() === 'webview'
        );
      });
  }

  override _getIsPageTargetCallback(): IsPageTargetCallback | undefined {
    return this.#isPageTargetCallback;
  }

  /**
   * Creates a new incognito browser context. This won't share cookies/cache with other
   * browser contexts.
   *
   * @example
   *
   * ```ts
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   // Create a new incognito browser context.
   *   const context = await browser.createIncognitoBrowserContext();
   *   // Create a new page in a pristine context.
   *   const page = await context.newPage();
   *   // Do stuff
   *   await page.goto('https://example.com');
   * })();
   * ```
   */
  override async createIncognitoBrowserContext(
    options: BrowserContextOptions = {}
  ): Promise<CdpBrowserContext> {
    const {proxyServer, proxyBypassList} = options;

    const {browserContextId} = await this.#connection.send(
      'Target.createBrowserContext',
      {
        proxyServer,
        proxyBypassList: proxyBypassList && proxyBypassList.join(','),
      }
    );
    const context = new CdpBrowserContext(
      this.#connection,
      this,
      browserContextId
    );
    this.#contexts.set(browserContextId, context);
    return context;
  }

  /**
   * Returns an array of all open browser contexts. In a newly created browser, this will
   * return a single instance of {@link BrowserContext}.
   */
  override browserContexts(): CdpBrowserContext[] {
    return [this.#defaultContext, ...Array.from(this.#contexts.values())];
  }

  /**
   * Returns the default browser context. The default browser context cannot be closed.
   */
  override defaultBrowserContext(): CdpBrowserContext {
    return this.#defaultContext;
  }

  override async _disposeContext(contextId?: string): Promise<void> {
    if (!contextId) {
      return;
    }
    await this.#connection.send('Target.disposeBrowserContext', {
      browserContextId: contextId,
    });
    this.#contexts.delete(contextId);
  }

  #createTarget = (
    targetInfo: Protocol.Target.TargetInfo,
    session?: CdpCDPSession
  ) => {
    const {browserContextId} = targetInfo;
    const context =
      browserContextId && this.#contexts.has(browserContextId)
        ? this.#contexts.get(browserContextId)
        : this.#defaultContext;

    if (!context) {
      throw new Error('Missing browser context');
    }

    const createSession = (isAutoAttachEmulated: boolean) => {
      return this.#connection._createSession(targetInfo, isAutoAttachEmulated);
    };
    const targetForFilter = new OtherTarget(
      targetInfo,
      session,
      context,
      this.#targetManager,
      createSession
    );
    if (targetInfo.url?.startsWith('devtools://')) {
      return new DevToolsTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
        this.#ignoreHTTPSErrors,
        this.#defaultViewport ?? null,
        this.#screenshotTaskQueue
      );
    }
    if (this.#isPageTargetCallback(targetForFilter)) {
      return new PageTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession,
        this.#ignoreHTTPSErrors,
        this.#defaultViewport ?? null,
        this.#screenshotTaskQueue
      );
    }
    if (
      targetInfo.type === 'service_worker' ||
      targetInfo.type === 'shared_worker'
    ) {
      return new WorkerTarget(
        targetInfo,
        session,
        context,
        this.#targetManager,
        createSession
      );
    }
    return new OtherTarget(
      targetInfo,
      session,
      context,
      this.#targetManager,
      createSession
    );
  };

  #onAttachedToTarget = async (target: CdpTarget) => {
    if (
      (await target._initializedDeferred.valueOrThrow()) ===
      InitializationStatus.SUCCESS
    ) {
      this.emit(BrowserEvent.TargetCreated, target);
      target.browserContext().emit(BrowserContextEvent.TargetCreated, target);
    }
  };

  #onDetachedFromTarget = async (target: CdpTarget): Promise<void> => {
    target._initializedDeferred.resolve(InitializationStatus.ABORTED);
    target._isClosedDeferred.resolve();
    if (
      (await target._initializedDeferred.valueOrThrow()) ===
      InitializationStatus.SUCCESS
    ) {
      this.emit(BrowserEvent.TargetDestroyed, target);
      target.browserContext().emit(BrowserContextEvent.TargetDestroyed, target);
    }
  };

  #onTargetChanged = ({target}: {target: CdpTarget}): void => {
    this.emit(BrowserEvent.TargetChanged, target);
    target.browserContext().emit(BrowserContextEvent.TargetChanged, target);
  };

  #onTargetDiscovered = (targetInfo: Protocol.Target.TargetInfo): void => {
    this.emit(BrowserEvent.TargetDiscovered, targetInfo);
  };

  /**
   * The browser websocket endpoint which can be used as an argument to
   * {@link Puppeteer.connect}.
   *
   * @returns The Browser websocket url.
   *
   * @remarks
   *
   * The format is `ws://${host}:${port}/devtools/browser/<id>`.
   *
   * You can find the `webSocketDebuggerUrl` from `http://${host}:${port}/json/version`.
   * Learn more about the
   * {@link https://chromedevtools.github.io/devtools-protocol | devtools protocol} and
   * the {@link
   * https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target
   * | browser endpoint}.
   */
  override wsEndpoint(): string {
    return this.#connection.url();
  }

  /**
   * Promise which resolves to a new {@link Page} object. The Page is created in
   * a default browser context.
   */
  override async newPage(): Promise<Page> {
    return await this.#defaultContext.newPage();
  }

  override async _createPageInContext(contextId?: string): Promise<Page> {
    const {targetId} = await this.#connection.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: contextId || undefined,
    });
    const target = (await this.waitForTarget(t => {
      return (t as CdpTarget)._targetId === targetId;
    })) as CdpTarget;
    if (!target) {
      throw new Error(`Missing target for page (id = ${targetId})`);
    }
    const initialized =
      (await target._initializedDeferred.valueOrThrow()) ===
      InitializationStatus.SUCCESS;
    if (!initialized) {
      throw new Error(`Failed to create target for page (id = ${targetId})`);
    }
    const page = await target.page();
    if (!page) {
      throw new Error(
        `Failed to create a page for context (id = ${contextId})`
      );
    }
    return page;
  }

  /**
   * All active targets inside the Browser. In case of multiple browser contexts, returns
   * an array with all the targets in all browser contexts.
   */
  override targets(): CdpTarget[] {
    return Array.from(
      this.#targetManager.getAvailableTargets().values()
    ).filter(target => {
      return (
        target._initializedDeferred.value() === InitializationStatus.SUCCESS
      );
    });
  }

  /**
   * The target associated with the browser.
   */
  override target(): CdpTarget {
    const browserTarget = this.targets().find(target => {
      return target.type() === 'browser';
    });
    if (!browserTarget) {
      throw new Error('Browser target is not found');
    }
    return browserTarget;
  }

  override async version(): Promise<string> {
    const version = await this.#getVersion();
    return version.product;
  }

  /**
   * The browser's original user agent. Pages can override the browser user agent with
   * {@link Page.setUserAgent}.
   */
  override async userAgent(): Promise<string> {
    const version = await this.#getVersion();
    return version.userAgent;
  }

  override async close(): Promise<void> {
    await this.#closeCallback.call(null);
    this.disconnect();
  }

  override disconnect(): void {
    this.#targetManager.dispose();
    this.#connection.dispose();
    this._detach();
  }

  /**
   * Indicates that the browser is connected.
   */
  override isConnected(): boolean {
    return !this.#connection._closed;
  }

  #getVersion(): Promise<Protocol.Browser.GetVersionResponse> {
    return this.#connection.send('Browser.getVersion');
  }
}

/**
 * @internal
 */
export class CdpBrowserContext extends BrowserContext {
  #connection: Connection;
  #browser: CdpBrowser;
  #id?: string;

  constructor(connection: Connection, browser: CdpBrowser, contextId?: string) {
    super();
    this.#connection = connection;
    this.#browser = browser;
    this.#id = contextId;
  }

  override get id(): string | undefined {
    return this.#id;
  }

  /**
   * An array of all active targets inside the browser context.
   */
  override targets(): CdpTarget[] {
    return this.#browser.targets().filter(target => {
      return target.browserContext() === this;
    });
  }

  /**
   * This searches for a target in this specific browser context.
   *
   * @example
   * An example of finding a target for a page opened via `window.open`:
   *
   * ```ts
   * await page.evaluate(() => window.open('https://www.example.com/'));
   * const newWindowTarget = await browserContext.waitForTarget(
   *   target => target.url() === 'https://www.example.com/'
   * );
   * ```
   *
   * @param predicate - A function to be run for every target
   * @param options - An object of options. Accepts a timeout,
   * which is the maximum wait time in milliseconds.
   * Pass `0` to disable the timeout. Defaults to 30 seconds.
   * @returns Promise which resolves to the first target found
   * that matches the `predicate` function.
   */
  override waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options: {timeout?: number} = {}
  ): Promise<Target> {
    return this.#browser.waitForTarget(target => {
      return target.browserContext() === this && predicate(target);
    }, options);
  }

  /**
   * An array of all pages inside the browser context.
   *
   * @returns Promise which resolves to an array of all open pages.
   * Non visible pages, such as `"background_page"`, will not be listed here.
   * You can find them using {@link Target.page | the target page}.
   */
  override async pages(): Promise<Page[]> {
    const pages = await Promise.all(
      this.targets()
        .filter(target => {
          return (
            target.type() === 'page' ||
            (target.type() === 'other' &&
              this.#browser._getIsPageTargetCallback()?.(target))
          );
        })
        .map(target => {
          return target.page();
        })
    );
    return pages.filter((page): page is Page => {
      return !!page;
    });
  }

  /**
   * Returns whether BrowserContext is incognito.
   * The default browser context is the only non-incognito browser context.
   *
   * @remarks
   * The default browser context cannot be closed.
   */
  override isIncognito(): boolean {
    return !!this.#id;
  }

  /**
   * @example
   *
   * ```ts
   * const context = browser.defaultBrowserContext();
   * await context.overridePermissions('https://html5demos.com', [
   *   'geolocation',
   * ]);
   * ```
   *
   * @param origin - The origin to grant permissions to, e.g. "https://example.com".
   * @param permissions - An array of permissions to grant.
   * All permissions that are not listed here will be automatically denied.
   */
  override async overridePermissions(
    origin: string,
    permissions: Permission[]
  ): Promise<void> {
    const protocolPermissions = permissions.map(permission => {
      const protocolPermission =
        WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
      if (!protocolPermission) {
        throw new Error('Unknown permission: ' + permission);
      }
      return protocolPermission;
    });
    await this.#connection.send('Browser.grantPermissions', {
      origin,
      browserContextId: this.#id || undefined,
      permissions: protocolPermissions,
    });
  }

  /**
   * Clears all permission overrides for the browser context.
   *
   * @example
   *
   * ```ts
   * const context = browser.defaultBrowserContext();
   * context.overridePermissions('https://example.com', ['clipboard-read']);
   * // do stuff ..
   * context.clearPermissionOverrides();
   * ```
   */
  override async clearPermissionOverrides(): Promise<void> {
    await this.#connection.send('Browser.resetPermissions', {
      browserContextId: this.#id || undefined,
    });
  }

  /**
   * Creates a new page in the browser context.
   */
  override newPage(): Promise<Page> {
    return this.#browser._createPageInContext(this.#id);
  }

  /**
   * The browser this browser context belongs to.
   */
  override browser(): CdpBrowser {
    return this.#browser;
  }

  /**
   * Closes the browser context. All the targets that belong to the browser context
   * will be closed.
   *
   * @remarks
   * Only incognito browser contexts can be closed.
   */
  override async close(): Promise<void> {
    assert(this.#id, 'Non-incognito profiles cannot be closed!');
    await this.#browser._disposeContext(this.#id);
  }
}
