/*
* Script Name: Snipe God Importer/Exporter
* Version: v1.0
* Last Updated: 2024-07-28
* Author: NunoF-
* Author URL: https://nunoferr.github.io/
* Author Contact: Discord - ducks4ever#quack
* Approved: No approval required
* Approved Date: No approval required
* Mod: No approval required
* Credits: Made for RedAlert's Snipe God script
*/

if (typeof MassSnipeExport == 'undefined') {
class MassSnipeExport {
    static MassSnipeExportTranslations = {
        en_US: {
            title: 'Mass Snipe Exporter/Importer',
            export: 'Import code',
            import: 'Export code',
            cancel: 'Cancel',
            successMessages: {
                successfullyExported: 'Code exported successfully!',
                successfullyImported: 'Code imported successfully!',
            }
        },
        pt_PT: {
            title: 'Mass Snipe Exportador/Importador',
            export: 'Exportar código',
            import: 'Importar código',
            cancel: 'Cancelar',
            successMessages: {
                successfullyExported: 'Código exportado com sucesso!',
                successfullyImported: 'Código importado com sucesso!',
            }
        }
    };

    constructor() {
        this.UserTranslation = game_data.locale in MassSnipeExport.MassSnipeExportTranslations ? this.UserTranslation = MassSnipeExport.MassSnipeExportTranslations[game_data.locale] : MassSnipeExport.MassSnipeExportTranslations.en_US;
    }

    async init() {
        this.#openUI();
    }

    #createDialog(type, dialogContent, endFunction) {
        var i = $.extend({
            class_name: '',
            close_from_fader: !0,
            auto_width: !1,
            allow_close: 1,
            priority: Dialog.PRIORITY_NONE,
            subdialog: !0,
            body_class: 'dialog-open'
        });
        Dialog.show(type, dialogContent, endFunction, i);
    }

    
    #openUI() {
        var html = '<div style="text-align:center;min-width:80%;"><h2>' + this.UserTranslation.title + '</h2>' + 
        '<textarea style="width: 90%; height: 80%;" id="bbCodeText"></textarea>' +
        '<br><br><button class="btn evt-confirm-btn btn-confirm-yes" onclick="massSnipeExport.import()">' + this.UserTranslation.import + '</button>' + 
        '<button class="btn evt-confirm-btn btn-confirm-yes" onclick="massSnipeExport.export()">' + this.UserTranslation.export + '</button><button class="btn evt-cancel-btn btn-confirm-no" onclick="Dialog.close()">' +
        this.UserTranslation.cancel + '</button><br></div>';
        this.#createDialog('import', html, Dialog.close());
        $('#popup_box_import').css('min-width', '80%');
        $('#popup_box_import').css('height', '80%');
        $('#popup_box_import').children("div").css('height', '100%');
        $('#popup_box_import').children("div").children("div").css('height', '100%');
    }

    import() {
        sessionStorage.setItem("massSnipe_snipes_needed", $('#bbCodeText').val());
        UI.SuccessMessage(this.UserTranslation.successMessages.successfullyImported);
    }

    export() {
        $('#bbCodeText').val(sessionStorage.getItem("massSnipe_snipes_needed")); 
        UI.SuccessMessage(this.UserTranslation.successMessages.successfullyExported);
    }
}
var massSnipeExport = new MassSnipeExport();
massSnipeExport.init();
} else {
var massSnipeExport = new MassSnipeExport();
massSnipeExport.init();
}