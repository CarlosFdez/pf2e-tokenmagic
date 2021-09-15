export const defaultOpacity = 0.5;
export const emptyPreset = "NOFX";

const defaultTraitValues = {
    acid: {
        tint: "#2d8000",
        opacity: 0.6,
        preset: "Watery Surface 2"
    },
    cold: { 
        tint: "#47b3ff",
        preset: "Thick Fog"
    },
    electricity: {
        preset: "Shock"
    },
    fire: {
        preset: "Flames"
    },
    force: {
        preset: "Waves 3"
    },
    mental: {
        tint: "#8000ff",
        preset: "Classic Rays"
    },
    negative: {
        tint: "#502673",
        preset: "Smoke Filaments"
    },
    poison: {
        tint: "#00a80b",
        preset: "Smoky Area"
    },
    positive: {
        preset: "Annihilating Rays"
    },
    sonic: {
        tint: "#0060ff",
        preset: "Waves"
    }
};

function removeFalsyEntries(object) {
    const result = {};
    for (const [key, value] of Object.entries(object)) {
        if (value) result[key] = value;
    }
    return result;
}

/** From PF2e source */
function sluggify(entityName) {
    return entityName
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/gi, " ")
        .trim()
        .replace(/[-\s]+/g, "-");
}

export class AutoTemplatePF2E {
    static get defaultConfiguration() {
        const defaultConfig = {
            categories: {},
            overrides: {
                0: {
                    target: "Stinking Cloud",
                    opacity: 0.5,
                    tint: "#00a80b",
                    preset: "Smoky Area",
                    texture: null,
                },
                1: {
                    target: "Sanguine Mist",
                    opacity: 0.6,
                    tint: "#c41212",
                    preset: "Smoky Area",
                },
                2: {
                    target: "Web",
                    opacity: 0.5,
                    tint: "#808080",
                    preset: "Spider Web 2",
                    texture: null,
                },
                3: {
                    target: "Incendiary Aura",
                    opacity: 0.2,
                    tint: "#b12910",
                    preset: "Smoke Filaments",
                    texture: null
                }
            },
        };

        Object.keys(CONFIG.PF2E.damageTraits).forEach((dmgType) => {
            const values = defaultTraitValues[dmgType];
            if (defaultConfig.categories[dmgType] == undefined) {
                const config = {opacity: defaultOpacity, tint: null};
                if (values) {
                    config.tint = values.tint ?? config.tint;
                    config.opacity = values.opacity ?? config.opacity;
                }

                defaultConfig.categories[dmgType] = config;
            }
            Object.keys(CONFIG.MeasuredTemplate.types).forEach((tplType) => {
                const config = {preset: emptyPreset, texture: null}
                config.preset = values?.preset ?? config.preset;
                defaultConfig.categories[dmgType][tplType] = config;
            });
        });

        return defaultConfig;
    }

    static getTMFXSettings(origin, templateType) {
        const settings = game.settings.get("pf2e-tokenmagic", "autoTemplateSettings");
        if (!settings) return null;

        // Check if this is a name override, if so return that
        const { name, slug } = origin;
        const nameConfig = Object.values(settings.overrides ?? {})
            .find((el) => (
                el.target.toLowerCase() === name?.toLowerCase()
                || sluggify(el.target) === slug
            ));
        if (nameConfig) {
            return nameConfig;
        }

        // Now do traits matching, and merge newer stuff as higher priority
        const traits = new Set(origin.traits ?? []);
        const config = {};
        for (const [trait, value] of Object.entries(settings.categories ?? {})) {
            if (!traits.has(trait)) continue;
            const { opacity, tint } = value;
            mergeObject(config, removeFalsyEntries({ opacity, tint }));
            const data = value[templateType];
            if (data) {
                mergeObject(config, removeFalsyEntries(data));
            }
        }

        if (isObjectEmpty(config)) return null;

        mergeObject(config, { opacity: defaultOpacity }, { overwrite: false });
        //mergeObject(config, {opacity: dmgSettings.opacity, tint: dmgSettings.tint}, true, true);
        return config;
    }
}

