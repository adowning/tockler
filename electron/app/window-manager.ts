import { menubar } from 'menubar';
import MenuBuilder from './menu-builder';
import { throttle } from 'lodash';
import { app, ipcMain, BrowserWindow } from 'electron';
import config from './config';
import * as os from 'os';
import { logManager } from './log-manager';
import { join } from 'path';

let logger = logManager.getLogger('WindowManager');

const preloadScript = join(__dirname, 'preloadStuff.js');

export const sendToTrayWindow = (key, message = '') => {
    if (WindowManager.menubar.window) {
        WindowManager.menubar.window.webContents.send(key, message);
    } else {
        logger.debug(`Menubar not defined yet, not sending ${key}`);
    }
};

export default class WindowManager {
    static mainWindow;
    static timesheetWindow;
    static menubar;

    static initMenus() {
        const menuBuilder = new MenuBuilder();
        menuBuilder.buildMenu();
    }

    static setMainWindow() {
        logger.debug('Creating main window.');
        const windowSize = config.persisted.get('windowsize') || { width: 1080, height: 720 };
        const openMaximized = config.persisted.get('openMaximized') || false;

        this.mainWindow = new BrowserWindow({
            width: windowSize.width,
            height: windowSize.height,

            show: false,
            webPreferences: {
                zoomFactor: 1.0,
                preload: preloadScript,
            },
            title: 'Tockler',
            icon: config.iconBig,
        });

        if (app.dock) {
            logger.debug('Show dock window.');
            app.dock.show();
        }

        if (openMaximized) {
            this.mainWindow.maximize();
        }

        const url = config.isDev ? 'http://localhost:3000' : `file://${__dirname}/index.html`;

        this.mainWindow.loadURL(url);

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            logger.debug('Main window closed');
        });

        this.mainWindow.on('focus', () => {
            let sendEventName = 'main-window-focus';
            logger.debug('Sending focus event: ' + sendEventName);
            // this.mainWindow.webContents.send(sendEventName, 'ping');
        });

        this.mainWindow.webContents.on('did-finish-load', () => {
            logger.debug('did-finish-load');
            this.mainWindow.show();
            this.mainWindow.focus();
        });

        this.mainWindow.on('close', () => {
            if (this.mainWindow) {
                logger.debug('Closing window');
                this.mainWindow = null;
            }
            if (app.dock) {
                logger.debug('Hide dock window.');
                app.dock.hide();
            }
        });
        this.mainWindow.on('resize', throttle(WindowManager.storeWindowSize, 500));
        WindowManager.initMenus();
    }

    public static openMainWindow() {
        if (!WindowManager.mainWindow) {
            WindowManager.setMainWindow();
        }

        if (WindowManager.mainWindow.isMinimized()) {
            WindowManager.mainWindow.restore();
        }

        WindowManager.mainWindow.show();
        logger.debug('Focusing main window');
        WindowManager.mainWindow.focus();
    }

    static initMainWindowEvents() {
        logger.debug('Init main window events.');

        ipcMain.on('toggle-main-window', (ev, name) => {
            if (!this.mainWindow) {
                logger.debug('MainWindow closed, opening');
                WindowManager.setMainWindow();
            }

            logger.debug('Toggling main window');

            if (this.mainWindow.isVisible() && !this.mainWindow.isMinimized()) {
                logger.debug('Hide main window');
                this.mainWindow.hide();
            } else if (this.mainWindow.isMinimized()) {
                logger.debug('Restore main window');
                this.mainWindow.restore();
            } else {
                logger.debug('Show main window');
                this.mainWindow.show();
            }
        });
    }

    static storeWindowSize() {
        try {
            config.persisted.set('windowsize', WindowManager.mainWindow.getBounds());
        } catch (e) {
            logger.error('Error saving', e);
        }
    }

    static setTimesheetWindow() {
        logger.debug('Creating timesheet window.');
        const timesheetWindowSize = config.persisted.get('timesheetWindowsize') || {
            width: 1080,
            height: 720,
        };
        const openMaximized = config.persisted.get('openTimesheetWindowMaximized') || false;

        this.mainWindow = new BrowserWindow({
            width: timesheetWindowSize.width,
            height: timesheetWindowSize.height,

            show: false,
            webPreferences: {
                zoomFactor: 1.0,
                preload: preloadScript,
            },
            title: 'Andrews Timesheets',
            icon: config.iconBig,
        });

        if (app.dock) {
            logger.debug('Show dock timesheetWindow.');
            app.dock.show();
        }

        if (openMaximized) {
            this.timesheetWindow.maximize();
        }

        const timesheetUrl = config.isDev
            ? 'http://localhost:8080'
            : `file://${__dirname}/index.html`;

        this.timesheetWindow.loadURL(timesheetUrl);

        this.timesheetWindow.on('closed', () => {
            this.timesheetWindow = null;
            logger.debug('Timesheet window  closed');
        });

        this.timesheetWindow.on('focus', () => {
            let sendEventName = 'timesheet-window-focus';
            logger.debug('Sending focus event: ' + sendEventName);
            this.timesheetWindow.webContents.send(sendEventName, 'ping');
        });

        this.timesheetWindow.webContents.on('did-finish-load', () => {
            logger.debug('timesheet-window-did-finish-load');
            this.timesheetWindow.show();
            this.timesheetWindow.focus();
        });

        this.timesheetWindow.on('close', () => {
            if (this.timesheetWindow) {
                logger.debug('Closing timesheetWindow');
                this.timesheetWindow = null;
            }
            if (app.dock) {
                logger.debug('Hide dock timesheetWindow.');
                app.dock.hide();
            }
        });
        this.timesheetWindow.on('resize', throttle(WindowManager.storeWindowSize, 500));
        WindowManager.initMenus();
    }

    public static openTimesheetWindow() {
        if (!WindowManager.timesheetWindow) {
            WindowManager.setTimesheetWindow();
        }

        if (WindowManager.timesheetWindow.isMinimized()) {
            WindowManager.timesheetWindow.restore();
        }

        WindowManager.timesheetWindow.show();
        logger.debug('Focusing timesheet window');
        WindowManager.timesheetWindow.focus();
    }

    static initTimesheetWindowEvents() {
        logger.debug('Init timesheet window events.');

        ipcMain.on('toggle-timesheet-window', (ev, name) => {
            if (!this.timesheetWindow) {
                logger.debug('TimesheetWindow closed, opening');
                WindowManager.setTimesheetWindow();
            }

            logger.debug('Toggling timesheet window');

            if (this.timesheetWindow.isVisible() && !this.timesheetWindow.isMinimized()) {
                logger.debug('Hide timesheet window');
                this.timesheetWindow.hide();
            } else if (this.timesheetWindow.isMinimized()) {
                logger.debug('Restore timesheet window');
                this.timesheetWindow.restore();
            } else {
                logger.debug('Show timesheet window');
                this.timesheetWindow.show();
            }
        });
    }

    static storeTimesheetWindowSize() {
        try {
            config.persisted.set('timesheetWindowsize', WindowManager.timesheetWindow.getBounds());
        } catch (e) {
            logger.error('Error saving timesheetWindowsize', e);
        }
    }
    static setTrayWindow() {
        logger.debug('Creating tray window.');
        /**
         * Docs:
         * https://github.com/maxogden/menubar
         */
        let icon = os.platform() === 'darwin' ? config.icon : config.iconBig;
        const url = config.isDev
            ? 'http://localhost:3000/#/trayApp'
            : `file://${__dirname}/index.html#/trayApp`;

        this.menubar = menubar({
            index: url,
            icon: icon,
            preloadWindow: false,
            showDockIcon: false,

            browserWindow: {
                webPreferences: {
                    zoomFactor: 1.0,

                    preload: preloadScript,
                },
                width: 500,
                height: 600,
            },
        });

        // this.menubar.on('after-create-window', () => {});
        this.menubar.on('after-show', () => {
            this.menubar.window.webContents.send('focus-tray', 'ping');

            if (config.isDev) {
                logger.debug('Open menubar dev tools');
                this.menubar.window.openDevTools({ mode: 'bottom' });
            }
        });
    }
}

export const windowManager = new WindowManager();
