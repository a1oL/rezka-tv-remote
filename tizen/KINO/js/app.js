(function () {
    'use strict';

    var TIZENBREW_APP_ID = 'xvvl3S1bvH.TizenBrewStandalone';
    var launched = false;

    function byId(id) {
        return document.getElementById(id);
    }

    function setStatus(message, details) {
        var statusNode = byId('status');
        var detailsNode = byId('details');

        if (statusNode) {
            statusNode.textContent = message;
        }

        if (!detailsNode) {
            return;
        }

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

    function showLaunchError(error) {
        var message = error && error.message ? error.message : String(error || 'Nezināma kļūda');
        setStatus(
            'KINO neizdevās atvērt.',
            'Pārbaudi, vai televizorā ir uzinstalēta pati TizenBrew aplikācija un TizenBrew iestatījumos Auto Launch ir izvēlēts KINO modulis. Kļūda: ' + message
        );
    }

    function launchTizenBrew(appId, allowDiscovery) {
        if (launched) {
            return;
        }

        setStatus(
            'Atver KINO…',
            'TizenBrew iestatījumos Auto Launch jābūt izvēlētam KINO modulim.'
        );

        try {
            tizen.application.launch(
                appId,
                function () {
                    launched = true;
                    setTimeout(exitLauncher, 1200);
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
        var lowerId = id.toLowerCase();

        if (name.indexOf('installer') !== -1 || lowerId.indexOf('installer') !== -1) {
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
                var i;

                for (i = 0; i < apps.length; i += 1) {
                    if (isRealTizenBrewApp(apps[i])) {
                        match = apps[i];
                        break;
                    }
                }

                if (match) {
                    launchTizenBrew(match.id, false);
                    return;
                }

                setStatus(
                    'TizenBrew aplikācija nav atrasta.',
                    'Uzinstalē pašu TizenBrew aplikāciju. TizenBrew Installer nav tas pats. RETURN aizver šo logu.'
                );
            }, showLaunchError);
        } catch (error) {
            showLaunchError(error);
        }
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

        launchTizenBrew(TIZENBREW_APP_ID, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}());
