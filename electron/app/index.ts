// override path, to fix asar.unpacked paths
require('hazardous');
require('events').EventEmitter.defaultMaxListeners = 30;

import { backgroundJob } from './background-job';
import { backgroundService } from './background-service';
import { app, ipcMain, powerMonitor } from 'electron';
import { logManager } from './log-manager';

import AppManager from './app-manager';

import WindowManager from './window-manager';
import { extensionsManager } from './extensions-manager';
import AppUpdater from './app-updater';
import config from './config';

let logger = logManager.getLogger('AppIndex');
app.setAppUserModelId(process.execPath);

/* Single Instance Check */

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    logger.debug('Quiting instance.');
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        logger.debug('Make single instance');
        WindowManager.openMainWindow();
    });
    AppUpdater.init();

    if (config.isDev) {
        // const reloadFile = path.join(config.client);
        // require('electron-reload')(reloadFile);
    }

    app.commandLine.appendSwitch('disable-renderer-backgrounding');

    require('electron-context-menu')({});

    ipcMain.on('close-app', function() {
        logger.info('Closing Tockler');
        app.quit();
    });

    app.on('window-all-closed', function() {
        logger.debug('window-all-closed');
        // pluginMgr.removeAll();
        // app.quit();
    });

    // User want's to open main window when reopened app. (But not open main window on application launch)

    app.on('activate', function() {
        logger.debug('Activate event');
        if (app.isReady()) {
            WindowManager.openMainWindow();
        } else {
            logger.debug('App is not ready in activate event');
        }
    });

    app.on('ready', async () => {
        try {
            if (config.isDev) {
                await extensionsManager.init();
            }

            WindowManager.initMainWindowEvents();
            WindowManager.initTimesheetWindowEvents();

            if (!config.isDev || config.trayEnabledInDev) {
                WindowManager.setTrayWindow();
            }

            await AppManager.init();
            backgroundJob.init();

            powerMonitor.on('suspend', function() {
                logger.debug('The system is going to sleep');
                backgroundService.onSleep();
            });

            powerMonitor.on('resume', function() {
                logger.debug('The system is going to resume');
                backgroundService.onResume().then(
                    () => logger.debug('Resumed'),
                    e => logger.error('Error in onResume', e),
                );
            });
        } catch (error) {
            logger.error('App errored in ready event:', error);
            logger.error(error);
        }
    });
}
