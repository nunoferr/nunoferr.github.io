/*
* Script Name: Incoming Tribe Ataques
* Version: v1.0
* Last Updated: 2024-09-20
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
 class IncomingTribeAttacksDisplay {
    static IncomingTribeAttacksDisplayTranslations() {
        return {
            en_US: {
                title: 'Incoming Tribe Ataques',
                loadingMessage: 'Loading...',
                successMessage: 'Loaded successfully!',
                credits: 'Incoming Tribe Ataques script v1.0 by NunoF- (.com.pt)'
            },
            pt_PT: {
                title: 'Ataques a chegar à tribo',
                loadingMessage: 'A carregar...',
                successMessage: 'Carregado com sucesso!',
                credits: 'Ataques a chegar à tribo v1.0 por NunoF- (.com.pt)'
            }
        };
    }

    constructor() {
        this.UserTranslation = game_data.locale in IncomingTribeAttacksDisplay.IncomingTribeAttacksDisplayTranslations() ? this.UserTranslation = IncomingTribeAttacksDisplay.IncomingTribeAttacksDisplayTranslations()[game_data.locale] : IncomingTribeAttacksDisplay.IncomingTribeAttacksDisplayTranslations().en_US;
    }

    async init() {
        UI.InfoMessage(this.UserTranslation.loadingMessage);
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
        var html = `
        <h2 style="text-align: center;">${this.UserTranslation.title}</h2>
        <table class="vis" style="width: 100%;margin-bottom: 2px;">
            <tbody>
                ${await this.#fillIncomingTableMembers()}
            </tbody>
        </table>
        <div style="width: calc(100% + 18px);position: absolute;left: -9px;bottom: -9px;background-image: url(https://dspt.innogamescdn.com/asset/2a2f957f/graphic/screen/tableheader_bg3.png);margin-bottom: 0px;border-radius: 0px 0 8px 8px;text-align: center;font-weight: bold;font-size: 10px;">${this.UserTranslation.credits}</div>
        `;        
        Dialog.show('import', html, Dialog.close());
        $('#popup_box_import').css('min-width', '300px');
        UI.SuccessMessage(this.UserTranslation.successMessage);
    }
        
    async fetchMembersTroopsPage() {
        var data = null;
        await $.get(this.#generateUrl('ally', 'members_troops')).done(function(data_temp) {
            data = data_temp;
        });
        return data;
    }

    async #fillIncomingTableMembers() {
        var membersLine = '';
        var tribeIncomingAttacks = await this.fetchMembersTroopsPage();
        var tribeIncomingAttacksLines = $(tribeIncomingAttacks).find('#ally_content table:last tr');
        $.each(tribeIncomingAttacksLines.slice(1, -1), function (key, value) {
            var playerHref = $(value).find('a').attr('href');
            var playerName = $(value).find('a').text().trim();
            var playerIncomingAttacks = $(value).find('td:last').text().trim();
            membersLine += `
            <tr>
                <td ${getIncomingTableElementStyle(playerIncomingAttacks)}>
                    <a href="${playerHref}" ${getIncomingTableElementStyle(playerIncomingAttacks)}>${playerName}</a>                        
                </td>
                <td ${getIncomingTableElementStyle(playerIncomingAttacks)}>${playerIncomingAttacks}</td>
            </tr>
            `;
        });

        return `
        ${fillIncomingTableHeader(tribeIncomingAttacksLines.first().find('th'))}
        ${membersLine}
        <tr><td colspan="2"><hr></td></tr>
        ${fillIncomingTableSummary(tribeIncomingAttacksLines.last().find('td:last').text().trim())}
        `;

        function fillIncomingTableSummary(totalIncomingTribeAttacksCounter) {
            return `
            <tr>
                <td style="font-weight: bold;">Total</td>
                <td ${getIncomingTableElementStyle(totalIncomingTribeAttacksCounter)}>${totalIncomingTribeAttacksCounter}</td>
            </tr>
            `;
        }
    
        function fillIncomingTableHeader(headerLine) {
            return `
            <tr>
                <th class="column-name">${headerLine.first().text().trim()}</th>
                <th>
                    ${headerLine.last().html().trim()}                  
                </th>
            </tr>
            `;
        }
    
        function getIncomingTableElementStyle(value = '0') {
            return `${(value !== '0') ? `style="font-weight:bold;background:${value !== '?' ? 'red' : '#ff721f'};color:white;"` : ''}`;
        }
    }
}

var incomingTribeAttacksDisplay = new IncomingTribeAttacksDisplay();
incomingTribeAttacksDisplay.init();
}