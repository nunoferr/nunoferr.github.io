/*
* Script Name: On screen farm button
* Version: v1.0.0
* Last Updated: 2024-11-23
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

 if (typeof onScreenFarmButton !== 'undefined') {
    onScreenFarmButton.init();
 } else {
 class OnScreenFarmButton {
    static OnScreenEnterButtonTranslations = {
        en_US: {
            successAndCreditsMessage: 'On screen farm button script v1.0.0 by NunoF- (.com.pt)',
            errorMessage: 'FarmGod isn\'t running.<br>Please run FarmGod before running this script.',
            errorMessages: {
                notOnMobileApp: 'This script is only available on the mobile application.',
                farmGodIsntRunning: 'FarmGod isn\'t running.<br>Please run FarmGod before running this script.',
            },
            FarmBtnText: 'Farm'
        },
        pt_PT: {
            successAndCreditsMessage: 'Botão de farm no ecrã v1.0.0 by NunoF- (.com.pt)',
            errorMessages: {
                notOnMobileApp: 'Este script apenas está disponível na aplicação do telemóvel.',
                farmGodIsntRunning: 'O FarmGod não está a correr.<br>Por favor corra o FarmGod antes de correr este script.',
            },
            FarmBtnText: 'Farmar'
        }
    };

    constructor() {
        this.UserTranslation = game_data.locale in OnScreenFarmButton.OnScreenEnterButtonTranslations ? this.UserTranslation = OnScreenFarmButton.OnScreenEnterButtonTranslations[game_data.locale] : OnScreenFarmButton.OnScreenEnterButtonTranslations.en_US;
    }

    async init() {
        this.#openUI();
    }

    #openUI() {
        if ($('body').hasClass("desktop")) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.notOnMobileApp);
            return;
        }

        var farmGodDiv = $('.farmGodContent');
        if (farmGodDiv.length === 0) {
            UI.ErrorMessage(this.UserTranslation.errorMessages.farmGodIsntRunning);
            return;
        }

        UI.SuccessMessage(this.UserTranslation.successAndCreditsMessage);

        $('body').prepend(`<input type="button" id="pressToFarmButton" class="btn" value="${this.UserTranslation.FarmBtnText}"/>
        <style>
        body:not([desktop]) #pressToFarmButton {
            position: fixed;
            z-index: 10000;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            font-size: 15px !important;
            padding: 14px;
            top: 30px;
            right: 10px;
        }
        </style> 
        `);
        
        var pressToFarmButton = document.getElementById('pressToFarmButton');
        var interval = 0;

        pressToFarmButton.addEventListener('mousedown', () => {
            buttonBeingPressed();
        });   

        function buttonBeingPressed() {
            interval = setInterval(buttonBeingPressedHandler, 200);
        }

        function buttonBeingPressedHandler() {
            if (pressToFarmButton.matches(":active")) {
                triggerFarmGodBtn();
            } else {
                clearInterval(interval);
            }
        }
        
        function triggerFarmGodBtn() {
            farmGodDiv[0].dispatchEvent(new KeyboardEvent('keydown', {
                code: 'Enter',
                key: 'Enter',
                charCode: 13,
                keyCode: 13,
                view: window,
                bubbles: true
            }));
        };     
    }
}

var onScreenFarmButton = new OnScreenFarmButton();
onScreenFarmButton.init();
}