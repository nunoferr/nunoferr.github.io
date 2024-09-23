/*
* Script Name: Tribe Fulls Calculator
* Version: v1.0
* Last Updated: 2024-09-23
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever
* Approved: 
* Approved Date: 
* Forum URL (.net): 
* Mod: 
*/

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

 if (typeof incomingTribeAttacksDisplay !== 'undefined') {
    incomingTribeAttacksDisplay.init();
 } else {
 class AttackTribeCalculator {
    static AttackTribeCalculatorTranslations() {
        return {
            en_US: {
                title: 'Tribe Fulls Calculator',
                loadingMessage: 'Loading...',
                successMessage: 'Loaded successfully!',
                credits: 'Tribe Fulls Calculator script v1.0 by NunoF- (.com.pt)'
            },
            pt_PT: {
                title: 'Calculator de fulls da tribo',
                loadingMessage: 'A carregar...',
                successMessage: 'Carregado com sucesso!',
                credits: 'Calculador de fulls das tribo v1.0 por NunoF- (.com.pt)'
            }
        };
    }

    constructor() {
        this.UserTranslation = game_data.locale in AttackTribeCalculator.AttackTribeCalculatorTranslations() ? this.UserTranslation = AttackTribeCalculator.AttackTribeCalculatorTranslations()[game_data.locale] : IncomingTribeAttacksDisplay.IncomingTribeAttacksDisplayTranslations().en_US;
        this.UserTranslation = AttackTribeCalculator.AttackTribeCalculatorTranslations().en_US;
        this.availableSupportUnits = Object.create(game_data.units);
        this.availableSupportUnits.splice(this.availableSupportUnits.indexOf('militia'), 1);
        this.troopsColumnLocation = {};
        this.progressBarLoading = false;
    }

    async init() {
        this.#createUI();
    }
    
    #generateUrl(screen, mode = null, extraParams = {}) {
        var url = `/game.php?village=${game_data.village.id}&screen=${screen}`;
        if (mode !== null) url += `&mode=${mode}`;

        $.each(extraParams, function (key, value) {
            url += `&${key}=${value}`;
        });
        if(game_data.player.sitter !== "0") url += "&t=" + game_data.player.id;
        return url;
    }

    async #createUI() {
        Dialog.close();
        this.progressBarLoading = true;
        Dialog.show('import', `<h2 style="color:green;">${this.UserTranslation.loadingMessage}</h2><div id="attackTribeCalculatorLoadingBar" class="progress-bar live-progress-bar"><div style="background: rgb(146, 194, 0);"></div><span class="label" style="margin-top:0px;"></span></div>`, Dialog.close());
        UI.InitProgressBars()
        UI.updateProgressBar($('#attackTribeCalculatorLoadingBar'), 0, 0);
        
        var totalCount = await this.#getTribeTroopsCounter();

        var html = `
        <h2 style="text-align: center;">${this.UserTranslation.title}</h2>
        <div style="margin-bottom: 30px;">
            Aldeias com 1000 vikings e 300 cl = ${totalCount['axeAndCl']}
            </br>Aldeias: ${totalCount['playersAxeAndCl']}
            </br></br>
            Aldeias só com 1000 vikings ou só com 300 cl = ${totalCount['axeOrCl']}
            </br>Aldeias: ${totalCount['playersAxeOrCl']}
        </div>
        <div style="width: calc(100% + 18px);position: absolute;left: -9px;bottom: -9px;background-image: url(https://dspt.innogamescdn.com/asset/2a2f957f/graphic/screen/tableheader_bg3.png);background-repeat: round;margin-bottom: 0px;border-radius: 0px 0 8px 8px;text-align: center;font-weight: bold;font-size: 10px;line-height: 1.2;">${this.UserTranslation.credits}</div>
        `;        
        Dialog.show('import', html, Dialog.close());
        UI.SuccessMessage(this.UserTranslation.successMessage);
    }

    async #fetchTribeMembersPage() {
        var data = null;
        await $.get(this.#generateUrl('ally', 'members_troops')).done(function(data_temp) {
            data = data_temp;
        });
        return data;
    }
    
    async #handleTribeMembersPage() {
        var troopsMembersPage = await this.#fetchTribeMembersPage();
        var contentContainer = !($('#mobileHeader').length > 0) ? 'contentContainer' : 'content_value';
        var htmlContentContainer = $(troopsMembersPage).find(`#${contentContainer}`);

        setTroopsColumnLocation(this, htmlContentContainer);
        
        
        var userIdSelectOptions = $(htmlContentContainer).find('select[name$="player_id"]').eq(0).find('option:not(:first)');
        var usersIdsArr = {};
        $.each(userIdSelectOptions, function (key, value) {
            usersIdsArr[$(value).text().trim()] = $(value).attr('value');
        });
        return usersIdsArr;

        function setTroopsColumnLocation(currentObj, htmlContentContainer) {
            $.each($(htmlContentContainer).find('table:last tr th:not(:first):not(:last)'), function(id, value) {
                var src = $(value).find('img').eq(0).attr('src');
                currentObj.troopsColumnLocation[src.substring(src.indexOf('/unit/unit_') + 11, src.indexOf('.png'))] = id + 1;
            });
        }
    }

    async #fetchTribeUserTroopsPage(userId) {
        var data = null;
        await $.get(this.#generateUrl('ally', 'members_troops', { player_id: userId })).done(function(data_temp) {
            data = data_temp;
        });
        return data;
    }

    async #handleMemberPage(userId) {
        var pageContent = await this.#fetchTribeUserTroopsPage(userId);
        var contentContainer = !($('#mobileHeader').length > 0) ? 'contentContainer' : 'content_value';
        var troopsUserPageLines = $(pageContent).find(`#${contentContainer} table:last tr`);
        var userTroopsList = {};
        var currentObj = this;
        $.each(troopsUserPageLines.slice(1), function (key, value) {
            var villageTroops = {};
            $.each(currentObj.availableSupportUnits, function(key2, value2) {
                villageTroops[value2] = $(value).find('td').eq(currentObj.troopsColumnLocation[value2]).text().trim();
            });
            userTroopsList[/\d{3}\|\d{3}/.exec($(value).find('td a').eq(0).text())[0]] = villageTroops;
            // villageTroops[village] = /\d{3}\|\d{3}/.exec($(value).find('td a').eq(0).text())[0];
            // userTroopsList[$('select').find('option:selected').text().trim()] = villageTroops;
        });
        return userTroopsList;
    }

    async #getTribeTroopsCounter() {
        var totalCount = {
            'axeAndCl' : 0,
            'playersAxeAndCl': '',
            'axeOrCl' : 0,
            'playersAxeOrCl': ''
        };

        var lastRunTime = 0;
        var users = await this.#handleTribeMembersPage();
        lastRunTime = Date.now();
        var currentObj = this;
        var c = 0;
        for(var key in users)
        {
            var value = users[key];
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0))); 
            var userTroops = await currentObj.#handleMemberPage(value);
            lastRunTime = Date.now();
            var playerAxeAndCl = '';
            var playerAxeOrCl = '';

            $.each(userTroops, function(key, value) {
                if (value['axe'] >= 1000 && value['light'] >= 300 ) {
                    totalCount['axeAndCl'] += 1;
                    playerAxeAndCl += key + ' ';
                } else if (value['axe'] >= 1000 || value['light'] >= 300 ) {
                    totalCount['axeOrCl'] += 1;
                    playerAxeOrCl += key + ' ';
                }
            });

            if (playerAxeAndCl != '') {
                totalCount['playersAxeAndCl'] += key + ': ' + playerAxeAndCl + '</br></br>';
            }
            if (playerAxeOrCl != '') {
                totalCount['playersAxeOrCl'] += key + ': ' + playerAxeOrCl + '</br></br>';
            }
            
            UI.updateProgressBar($('#attackTribeCalculatorLoadingBar'), c + 1, Object.keys(users).length);
            c++;
        };
        return totalCount;
    }
}

var attackTribeCalculator = new AttackTribeCalculator();
attackTribeCalculator.init();
}