import { get } from 'lodash';

const CONFIG = {
    'RU.mobile': {
        Push: { 'Push X': { probabilityPercent: 80 }, 'Push Y': { probabilityPercent: 20 } },
        Monetization: { 'Subscription': { probabilityPercent: 100 } },
    },
    'RU.desktop': {
        Push: { 'Push X': { probabilityPercent: 81 }, 'Push Y': { probabilityPercent: 19 } },
        Monetization: { 'Subscription': { probabilityPercent: 100 } },
    },
    'US.mobile': {
        Push: { 'Push X': { probabilityPercent: 80 }, 'Push Y': { probabilityPercent: 20 } },
        Monetization: { 'Subscription': { probabilityPercent: 100 } },
    },
    'US.desktop': {
        Push: { 'Push X': { 'probabilityPercent': 81 }, 'Push Y': { probabilityPercent: 19 } },
        Monetization: { 'Subscription': { probabilityPercent: 100 } },
    },
};

/**
 *
 */
describe('AdSet config', () => {

    /**
     *
     */
    it('01', () => {
        const strArgs = 'RU.desktop';

        const modulesConfig = getModulesConfig(strArgs);
        if (!modulesConfig) throw new Error(`Отсутствуют данные о конфигурации в "${strArgs}"`);
        console.log(modulesConfig);

        const modules = getRandomModules(modulesConfig);
        const result = {
            'adset_id': 83476,
            modules,
        };
        console.log(result);
    });

    /**
     *
     */
    it('02', () => {
        const countExperiments = 1e6;
        const strArgs = 'RU.desktop';

        const modulesConfig = getModulesConfig(strArgs);
        if (!modulesConfig) throw new Error(`Отсутствуют данные о конфигурации в "${strArgs}"`);
        console.log(modulesConfig);

        const stat: Record<string, Record<string, number>> = {};
        for (let i = 0; i < countExperiments; i++) {
            const modules = getRandomModules(modulesConfig);
            for (const module of modules) {
                const { type: moduleType, name: moduleId } = module;
                if (!stat[moduleType]) {
                    stat[moduleType] = {};
                }
                if (stat[moduleType][moduleId]) {
                    stat[moduleType][moduleId] += 1;
                } else {
                    stat[moduleType][moduleId] = 1;
                }
            }
        }
        console.log({ countExperiments, strArgs, stat });
    });
});

/**
 *
 */
function getModulesConfig(path: string): object|undefined {
    return get(CONFIG, path);
}

/**
 * https://translated.turbopages.org/proxy_u/en-ru.ru.0c28581d-67bc7084-be0b9f72-74722d776562/https/stackoverflow.com/questions/1761626/weighted-random-numbers
 */
function getRandomModuleId(moduleConfig: object): string|undefined {
    const SUM_OF_PROBABILITIES_PERCENT = 100;
    let rnd = Math.random() * SUM_OF_PROBABILITIES_PERCENT;
    for (const [moduleId, module] of Object.entries(moduleConfig)) {
        const moduleProbabilityPercent = module.probabilityPercent;
        if (!moduleProbabilityPercent) throw new Error(`Отсутствуют данные о вероятности в "${moduleId}"`);
        // console.log({ rnd, moduleId, moduleProbabilityPercent });

        if (rnd < moduleProbabilityPercent) return moduleId;
        rnd -= moduleProbabilityPercent;
    }
}

/**
 *
 */
function getRandomModules(modulesConfig: object): { type: string; name: string; }[] {
    const modules = [];
    for (const [moduleType, moduleConfig] of Object.entries(modulesConfig)) {
        const moduleId = getRandomModuleId(moduleConfig);
        if (moduleId) modules.push({
            type: moduleType,
            name: moduleId,
        });
    }
    return modules;
}
