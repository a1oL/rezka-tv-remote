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

    function discoverTizenBrew() {
        try {
            tizen.application.getAppsInfo(function (apps) {
                var match = null;
                for (var i = 0; i < apps.length; i += 1) {
                    var name = String(apps[i].name || '').toLowerCase();
                    var id = String(apps[i].id || '');
                    if (id === TIZENBREW_APP_ID || name.indexOf('tizenbrew') !== -1) {
                        match = apps[i];
                        break;
                    }
                }

                if (match) {
                    launchWithId(match.id, false);
                } else {
                    setStatus(
                        'TizenBrew nav atrasts.',
                        'Vispirms televizorā uzinstalē TizenBrew un tajā pievieno moduli a1oL/rezka-tv-remote. RETURN aizver šo logu.'
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
            'Pārbaudi, vai TizenBrew un modulis a1oL/rezka-tv-remote ir uzinstalēti. Kļūda: ' + message
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
