/*
* Script Name: Troop Counter Saven
* Version: v1.1.2
* Last Updated: 2024-10-16
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever#quack
* Approved: Yes
* Approved Date: 2024-08-20
* Forum URL (.net): https://forum.tribalwars.net/index.php?threads/villages-troops-counter.292771/
* Mod: RedAlert
*/

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

 if (typeof villagesTroopsCounter !== 'undefined') {
    villagesTroopsCounter.init();
 } else {
 class VillagesTroopsCounter {
    static VillagesTroopsCounterTranslations() {
        return {
            en_US: {
                title: 'Home and Scavenging Troops Counter',
                home: 'Home',
				scavenging: 'Scavenging',
				total: 'Total',
                errorMessages: {
                    premiumRequired: 'Error. A premium account is required to run this script!',
                    errorFetching: 'An error occured while trying to fetch the following URL:',
                    missingSavengeMassScreenElement: 'An error occurred trying to located the ScavengeMassScreen element inside the mass scavenge page.'
                },
                successMessage: 'Loaded successfully!',
                loadingMessage: 'Loading...',
                credits: 'Village Troops Counter script v1.1.2 by NunoF- (.com.pt)'
            },
            pt_PT: {
                title: 'Contador de tropas em casa e em buscas',
                home: 'Em casa',
				scavenging: 'Em busca',
				total: 'Total',
                errorMessages: {
                    premiumRequired: 'Erro. É necessário possuir conta premium para correr este script!',
                    errorFetching: 'Ocorreu um erro ao tentar carregar o seguinte URL:',
                    missingSavengeMassScreenElement: 'Ocorreu um erro ao tentar localizar o elemento ScavengeMassScreen dentro da página de buscas em massa.'
                },
                successMessage: 'Carregado com sucesso!',
                loadingMessage: 'A carregar...',
                credits: 'Contador de tropas em casa e em buscas v1.1.2 por NunoF- (.com.pt)'
            }
        };
    }

    constructor() {
        this.UserTranslation = game_data.locale in VillagesTroopsCounter.VillagesTroopsCounterTranslations() ? this.UserTranslation = VillagesTroopsCounter.VillagesTroopsCounterTranslations()[game_data.locale] : VillagesTroopsCounter.VillagesTroopsCounterTranslations().en_US;
        this.availableSupportUnits = Object.create(game_data.units);
        this.availableSupportUnits = Object.getPrototypeOf(this.availableSupportUnits);
        this.availableSupportUnits.splice(this.availableSupportUnits.indexOf('militia'), 1);
    }

    init() {
        if (!game_data.features.Premium.active) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.premiumRequired);
            return;
        }
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

    #initTroops() {
        var troops = {};
        this.availableSupportUnits.forEach(function(unit) {
			troops[unit] = 0;
        });
        return troops;
    }

	#fetchHtmlPage(url) {
		var temp_data = null;
		$.ajax({
			async: false,
			url: url,
			type: 'GET',
			success: function(data) {
				temp_data = data;
			},
			error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
				UI.ErrorMessage(`${this.UserTranslation.errorMessages.errorFetching} ${url}`); 
			}
		});
		return temp_data;
	}

    async #getTroopsObj() {
        var troopsObj = {
            'villagesTroops': this.#initTroops(),
            'scavengingTroops': this.#initTroops()
        };
		
        var currentPage = 0;
        var lastRunTime = null;
        do {
            var scavengingObject = await getScavengeMassScreenJson(this, currentPage, lastRunTime);
            if (!scavengingObject) return;
            if (scavengingObject.length === 0) break;
            lastRunTime = Date.now();

            $.each(scavengingObject, function(id, villageData) {
                $.each(villageData.unit_counts_home, function(key, value) {
                    if (key !== 'militia') troopsObj.villagesTroops[key] += value;
                });
                
                $.each(villageData.options, function(id, option) {
                    if (option.scavenging_squad !== null) {
                        $.each(option.scavenging_squad.unit_counts, function(key, value) {
                            if (key !== 'militia') troopsObj.scavengingTroops[key] += value;
                        });
                    }
                });
            });
            currentPage++;
        } while(true)
        
        return troopsObj;

        async function getScavengeMassScreenJson(currentObj, currentPage = 0, lastRunTime = 0) {
            await new Promise(res => setTimeout(res, Math.max(lastRunTime + 200 - Date.now(), 0))); 
            var html = currentObj.#fetchHtmlPage(currentObj.#generateUrl('place', 'scavenge_mass', {'page': currentPage}));
            var matches = html.match(/ScavengeMassScreen[\s\S]*?(,\n *\[.*?\}{0,3}\],\n)/);
            if (matches.length <= 1) {
                UI.ErrorMessage(this.UserTranslation.errorMessages.missingSavengeMassScreenElement);
                return false;
            }
            matches = matches[1];
            matches = matches.substring(matches.indexOf('['))
            matches = matches.substring(0, matches.length - 2)
            return JSON.parse(matches);
        }
    }

	#getGroupsObj() {
		var html = $.parseHTML(this.#fetchHtmlPage(this.#generateUrl('overview_villages', 'groups', {'type': 'static'})));
		var groups = $(html).find('.vis_item').find('a,strong');
        var groupsArr = {};
        if ($(groups).length > 0) {
		    $.each(groups, function(id, group) {
			    var val = $(group).text().trim();
			    groupsArr[group.getAttribute('data-group-id')] = val.substring(1, val.length - 1);
		    });
        } else { // User has more than 5 groups
            groups = $(html).find('.vis_item select option');
            $.each(groups, function(id, group) {
			    groupsArr[(new URLSearchParams($(group).val())).get('group')] = $(group).text().trim();
		    });
        }
		
		return groupsArr;
	}

    async #createUI() {
        UI.InfoMessage(this.UserTranslation.loadingMessage);
        var troopsObj = await this.#getTroopsObj();
		var html = `
<div>
<br>
   <h3 style="position:relative;">${this.UserTranslation.title}</h3>
        ${getGroupsHtml(this)}
        <br>
        <br>
        <table id="support_sum" class="vis overview_table" width="100%">
            <thead>
                ${getTroopsHeader(this.availableSupportUnits)}
            </thead>
            <tbody>
                ${getTroopsLine(this.UserTranslation.home, troopsObj.villagesTroops)}
                ${getTroopsLine(this.UserTranslation.scavenging, troopsObj.scavengingTroops)}
                ${getTroopsLine(this.UserTranslation.total, troopsObj, 1)} 
            </tbody>
        </table>
</div>
<div class="awareness-section">
    <img class="ribbon-cancer" src="https://nunoferr.github.io/TribalWars/Scripts/VillagesTroopsCounter/assets/breastCancerAwarenessMonth/pngwing.com.png">
    <a href="https://www.ligacontracancro.pt/onda-rosa/" target="_blank">Liga Portuguesa Contra o Cancro</a>
    <a href="https://breastcancernow.org/get-involved/breast-cancer-awareness-month/" target="_blank">Breast Cancer Awareness Month</a>
</div>
<style>
.borderimage .popup_box {
	border-image: url("https://nunoferr.github.io/TribalWars/Scripts/VillagesTroopsCounter/assets/breastCancerAwarenessMonth/border.png") 19 19 19 19 repeat !important;
}

.popup_box_content {
	background: #f9c5d1 !important;
    min-width: 600px;
}

.mds .popup_box_content {
    min-width: unset !important;
}

#support_sum th {
	background-color: #CC8DA2 !important;
	background-image: url("https://nunoferr.github.io/TribalWars/Scripts/VillagesTroopsCounter/assets/breastCancerAwarenessMonth/tableheader_bg3.jpg") !important;
}

#support_sum td {
	background: pink;
}

.awareness-section {
    width: 210px;
    height: 30px;
    position: absolute;
    right: -9px;
    bottom: -9px;
    background: #f4b4ca;
    font-size: 10px;
    border-radius: 4px 0 4px 0;
    border-top: 1px solid #cc8da2;
    border-left: 1px solid #cc8da2;
}

.mds .awareness-section{
    border: 1px solid #cc8da2;
    bottom: -53px;
    right: -5px;
    height: 34px;
    border-radius: 4px 0px 4px 4px;
}

.awareness-section .ribbon-cancer {
    width: 22px;
    position: absolute;
    right: 0px;
    top: 1px;
}

.awareness-section a {
    position: absolute;
    top: 1x;
    left: 3px;
    color: #ee467e;
    text-decoration: underline;
}

.awareness-section a:hover {
    color: #da1e41;
}

.awareness-section a:nth-child(2) {
    top: 14px;
    left: 3px;
}
</style>
<!---br--->
<br>
<span style="text-decoration: bold;font-weight: bold;font-size: 10px;">${this.UserTranslation.credits}</span>
`;
        Dialog.show('import', html, Dialog.close());
        $('#popup_box_import').css('width', 'unset');
        UI.SuccessMessage(this.UserTranslation.successMessage, 500); 

		function getGroupsHtml(objInstance) {
			var groups = objInstance.#getGroupsObj();
			var html = '';
			$.each(groups, function(groupId, group) {
				var selected = game_data.group_id === groupId ? 'selected' : '';
				html += `<option value="${groupId}" ${selected}>${group}</option>`;
			});
			return '<select onchange="villagesTroopsCounter.changeGroup(this)">' + html + '</select>';
		}

		function getTroopsLine(translation, troopsObj, type = null) {
			var troops = type === null ? (() => { return troopsObj; }) : (() => {
				var troops = {};
				$.each(troopsObj.villagesTroops, function(key, value) {
					troops[key] = value + troopsObj.scavengingTroops[key];
				});
				return troops;
			});

			var html = `<tr><td class="center">${translation}</td>`;
			$.each(troops(), function(key, value) {
				html += `<td class="center" data-unit="${key}">${value}</td>`;
			});
         	html += `</tr>`;
			return html;
		}

		function getTroopsHeader(availableSupportUnits) {
			var html = `<tr><th class="center"></th>`;
			$.each(availableSupportUnits, function(key, value) {
				html += `<th style="text-align:center" width="35"><a href="#" class="unit_link" data-unit="${value}"><img src="https://dspt.innogamescdn.com/asset/2a2f957f/graphic/unit/unit_${value}.png" class=""></a></th>`;
			});
         	html += `</tr>`;
			return html;
		}
    }

	changeGroup(obj) {
		this.#fetchHtmlPage(this.#generateUrl('overview_villages', null, { 'group': obj.value }));
		game_data.group_id = obj.value;
		this.#createUI();
	}
}

var villagesTroopsCounter = new VillagesTroopsCounter();
villagesTroopsCounter.init();
}