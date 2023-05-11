import { TokenMagicSettingsPF2e } from "./settings.mjs";
import { AutoTemplatePF2E } from "./pf2e.mjs";
import { PresetsLibrary } from "./settings.mjs";

Hooks.on("createMeasuredTemplate", async (template, data) => {
    // Ensure this is the owner, so we don't get multi-template updates
    if (template.user.id !== game.user.id) {
        return;
    }
    
    const tokenMagicSet = !!template.flags.tokenmagic?.preset;
    const origin = template.flags.pf2e?.origin;
    if (!tokenMagicSet && origin) {
        const config = AutoTemplatePF2E.getTMFXSettings(origin, template.t);
        if (!config) return;

        console.log(config);

        const updateData = {};
        
        const tint = config.tint ? colorStringToHex(config.tint) : null;
        updateData.tmfxPreset = config.preset;
        updateData.tmfxTint = config.tint;
        updateData.tmfxTextureAlpha = config.opacity;
        updateData.texture = config.texture;
        
        if ("opacity" in config || "tint" in config) {
            updateData["flags.tokenmagic.templateData"] = {
                opacity: config.opacity,
                tint: config.tint ? colorStringToHex(config.tint) : null,
            };
        }

        const preset = (() => {
            if (!("preset" in config)) return null;
            return TokenMagic.getPreset({
                name: config.preset,
                library: PresetsLibrary.TEMPLATE,
                color: tint ?? undefined,
            });
        })();

        if (preset && !config.texture) {
            updateData.texture = TokenMagic._getPresetTemplateDefaultTexture(config.preset);
        }

        if (!foundry.utils.isEmpty(updateData)) {
            await template.update(updateData);
        }
    }
});
Hooks.on("init", () => {
    TokenMagicSettingsPF2e.initializeSettings();
    globalThis.TokenMagicSettingsPF2e = TokenMagicSettingsPF2e;

    // Override of getCircleShape() to approximate the correct size for template visualization
    CONFIG.MeasuredTemplate.objectClass.prototype._getCircleShape = function(distance) {
        const gridCenter = canvas.grid.getCenter(this.x, this.y);
        const isEmanation = gridCenter[0] === this.x && gridCenter[1] === this.y;
        if (isEmanation) {
            return new PIXI.Circle(0, 0, distance + (canvas.dimensions.size / 2));
        }

        const gridTopLeft = canvas.grid.getTopLeft(this.x, this.y);
        const isBurst = gridTopLeft[0] === this.x && gridTopLeft[1] === this.y;
        if (isBurst) {
            return new PIXI.Circle(0, 0, distance - (canvas.dimensions.size * 0.26));
        }

        return new PIXI.Circle(0, 0, distance);
    }

    loadTemplates([
        "modules/pf2e-tokenmagic/templates/settings.html",
        "modules/pf2e-tokenmagic/templates/categories.html",
        "modules/pf2e-tokenmagic/templates/overrides.html",
    ]);
});