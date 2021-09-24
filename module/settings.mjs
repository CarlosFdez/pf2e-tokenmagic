import { defaultOpacity, AutoTemplatePF2E } from "./pf2e.mjs";

export const PresetsLibrary = {
    MAIN: "tmfx-main",
    TEMPLATE: "tmfx-template"
};

export class TokenMagicSettingsPF2e extends FormApplication {
    /** @override */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "modules/pf2e-tokenmagic/templates/settings.html",
            height: "auto",
            title: game.i18n.localize("TMFX.settings.autoTemplateSettings.dialog.title"),
            width: 600,
            classes: ["tokenmagic", "settings"],
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: "form",
                    initial: "name",
                },
            ],
            submitOnClose: false,
        };
    }

    static initializeSettings() {
        const menuAutoTemplateSettings = {
            key: "autoTemplateSettings",
            config: {
                name: game.i18n.localize("TMFX.settings.autoTemplateSettings.button.name"),
                label: game.i18n.localize("TMFX.settings.autoTemplateSettings.button.label"),
                hint: game.i18n.localize("TMFX.settings.autoTemplateSettings.button.hint"),
                type: TokenMagicSettingsPF2e,
                restricted: true,
            },
        };
    
        const settingAutoTemplateSettings = {
            key: "autoTemplateSettings",
            config: {
                name: game.i18n.localize("TMFX.settings.autoTemplateSettings.name"),
                hint: game.i18n.localize("TMFX.settings.autoTemplateSettings.hint"),
                scope: "world",
                config: false,
                default: AutoTemplatePF2E.defaultConfiguration,
                type: Object,
            },
        };
    
        // Add some settings to token magic that it normally filters out for games other than 5e. We reuse the
        // language settings from token magic as well
        game.settings.registerMenu("pf2e-tokenmagic", menuAutoTemplateSettings.key, menuAutoTemplateSettings.config);
        game.settings.register(
            "pf2e-tokenmagic",
            settingAutoTemplateSettings.key,
            settingAutoTemplateSettings.config
        );
    }

    static get handler() {
        return AutoTemplatePF2E;
    }

    static getTMFXSettings(origin, templateType) {
        return AutoTemplatePF2E.getTMFXSettings(origin, templateType);
    }

    activateListeners($html) {
        super.activateListeners($html);

        $html.find("button.add-override").click(this._onAddOverride.bind(this));
        $html.find("button.remove-override").click(this._onRemoveOverride.bind(this));

        $html.find("[data-action='reset']").on("click", async (event) => {
            event.preventDefault();
            const result = await Dialog.confirm({
                title: game.i18n.localize("PF2E-TMFX.Reset"),
                content: game.i18n.localize("PF2E-TMFX.ResetWarning")
            });
            
            if (result) {
                const value = AutoTemplatePF2E.defaultConfiguration;
                await game.settings.set("pf2e-tokenmagic", "autoTemplateSettings", value);
                this.render(true);
            }
        });
    }

    /** @override */
    getData() {
        let data = super.getData();
        data.hasAutoTemplates = false;
        data.emptyPreset = null;

        mergeObject(data, {
            hasAutoTemplates: true,
            dmgTypes: CONFIG.PF2E.damageTraits,
            templateTypes: CONFIG.MeasuredTemplate.types
        });

        data.presets = TokenMagic.getPresets(PresetsLibrary.TEMPLATE).sort(function (a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });
        data.system = {id: game.system.id, title: game.system.data.title};
        data.settings = {
            autoTemplateEnable: true,
            autoTemplateSettings: AutoTemplatePF2E.settings,
        }
        data.submitText = game.i18n.localize("TMFX.save");
        return data;
    }

    /** @override */
    async _updateObject(_, formData) {
        const data = expandObject(formData);
        for (let [key, value] of Object.entries(data)) {
            if (key == "autoTemplateSettings" && value.overrides) {
                const compacted = {};
                Object.values(value.overrides).forEach((val, idx) => compacted[idx] = val);
                value.overrides = compacted;
            }
            await game.settings.set("pf2e-tokenmagic", key, value);
        }
    }
    
    async _onAddOverride(event) {
        event.preventDefault();
        let idx = 0;
        const entries = event.target.closest("div.tab").querySelectorAll("div.override-entry");
        const last = entries[entries.length - 1];
        if (last) {
            idx = last.dataset.idx + 1;
        }
        let updateData = {}
        updateData[`autoTemplateSettings.overrides.${idx}.target`] = "";
        updateData[`autoTemplateSettings.overrides.${idx}.opacity`] = defaultOpacity;
        updateData[`autoTemplateSettings.overrides.${idx}.tint`] = null;
        updateData[`autoTemplateSettings.overrides.${idx}.preset`] = null;
        updateData[`autoTemplateSettings.overrides.${idx}.texture`] = null;
        await this._onSubmit(event, {updateData: updateData, preventClose: true});
        this.render();
    }

    async _onRemoveOverride(event) {
        event.preventDefault();
        let idx = event.target.dataset.idx;
        const el = event.target.closest(`div[data-idx="${idx}"]`);
        if (!el) {
            return true;
        }
        el.remove();
        await this._onSubmit(event, {preventClose: true});
        this.render();
    }
}
