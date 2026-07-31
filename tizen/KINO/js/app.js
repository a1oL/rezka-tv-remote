(function () {
    'use strict';

    var TIZENBREW_APP_ID = 'xvvl3S1bvH.TizenBrewStandalone';
    var MODULE_NAME = 'rezka-tv-remote';
    var MODULE_TYPE = 'a1oL';
    var OPERATION = 'http://samsung.com/appcontrol/operation/eden_resume';
    var launched = false;

    function byId(id) {
        return document.getElementById(id);
    }

    function setStatus(message, details) {
        byId('status').textContent = message;
        var detailsNode = byId('details');
        if (details) {
            detailsNode.textContent = details;
            detailsNode.hidden = false;
        } else {
            detailsNode.hidden = true;
            detailsNode.textContent = '';
        }
    }

    function exitLauncher() {
        try {
            tizen.application.getCurrentApplication().exit();
        } catch (error) {
            window.close();
        }
    }

    function createAppControl() {
        var payload = JSON.stringify({
            moduleName: MODULE_NAME,
            moduleType: MODULE_TYPE,
            args: 'source=kino-launcher'
        });

        return new tizen.ApplicationControl(
            OPERATION,
            null,
            null,
            null,
            [new tizen.ApplicationControlData('kino.module', [payload])]
        );
    }

    function launchWithId(appId, allowDiscovery) {
        if (launched) {
            return;
        }

        setStatus('Atver KINO…');

        try {
            tizen.application.launchAppControl(
                createAppControl(),
                appId,
                function () {
                    launched = true;
                    setTimeout(exitLauncher, 700);
                },
                function (error) {
                    if (allowDiscovery) {
                        discoverTizenBrew();
                        return;
                    }
                    showLaunchError(error);
                }
            );
        } catch (error) {
            if (allowDiscovery) {
                discoverTizenBrew();
                return;
            }
            showLaunchError(error);
        }
    }

    function isRealTizenBrewApp(app) {
        var name = String(app.name || '').toLowerCase();
        var id = String(app.id || '');

        if (name.indexOf('installer') !== -1 || id.toLowerCase().indexOf('installer') !== -1) {
            return false;
        }

        if (id === TIZENBREW_APP_ID || /\.TizenBrewStandalone$/i.test(id)) {
            return true;
        }

        return name === 'tizenbrew' || name === 'tizenbrewnextgeneration';
    }

    function discoverTizenBrew() {
        try {
            tizen.application.getAppsInfo(function (apps) {
                var match = null;
                for (var i = 0; i < apps.length; i += 1) {
                    if (isRealTizenBrewApp(apps[i])) {
                        match = apps[i];
                        break;
                    }
                }

                if (match) {
                    launchWithId(match.id, false);
                } else {
                    setStatus(
                        'TizenBrew aplikācija nav atrasta.',
                        'KINO vairs neatvērs TizenBrew Installer. Pārbaudi, vai televizorā ir uzinstalēta pati TizenBrew aplikācija un tajā pievienots modulis a1oL/rezka-tv-remote. RETURN aizver šo logu.'
                    );
                }
            }, function (error) {
                showLaunchError(error);
            });
        } catch (error) {
            showLaunchError(error);
        }
    }

    function showLaunchError(error) {
        var message = error && error.message ? error.message : String(error || 'Nezināma kļūda');
        setStatus(
            'KINO neizdevās atvērt.',
            'Pārbaudi, vai ir uzinstalēta pati TizenBrew aplikācija (nevis tikai TizenBrew Installer) un modulis a1oL/rezka-tv-remote. Kļūda: ' + message
        );
    }

    function onKeyDown(event) {
        var keyCode = event.keyCode || event.which;
        if (keyCode === 10009 || keyCode === 10182) {
            event.preventDefault();
            exitLauncher();
        }
    }

    function start() {
        document.addEventListener('keydown', onKeyDown, true);

        if (!window.tizen || !tizen.application) {
            setStatus('Šī aplikācija darbojas tikai Samsung Tizen televizorā.');
            return;
        }

        launchWithId(TIZENBREW_APP_ID, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}());
