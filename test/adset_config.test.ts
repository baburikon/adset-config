import { get } from 'lodash';

type ModuleId = string;
type ModuleType = string;
type Path = string;

interface Module {
    probabilityPercent: number;
}

const CONFIG: Record<string, Record<ModuleType, Record<ModuleId, Module>>> = {
    'RU.mobile': {
        Push: { 'Push X': { probabilityPercent: 80 }, 'Push Y': { probabilityPercent: 20 } },
        Monetization: { 'Subscription': { probabilityPercent: 100 } },
    },
    'RU.desktop': {
        Push: { 'Push X': { probabilityPercent: 81 }, 'Push Y': { probabilityPercent: 19 } },
        Monetization: { 'Subscription': { probabilityPercent: 100 } },
        Xxx: { 'Xxx A': { probabilityPercent: 0 }, 'Xxx B': { probabilityPercent: 10 }, 'Xxx C': { probabilityPercent: 30 }, 'Xxx D': { probabilityPercent: 60 } },
        Yyy: { 'Yyy A': { probabilityPercent: 0 }, 'Yyy B': { probabilityPercent: 60 }, 'Yyy C': { probabilityPercent: 30 }, 'Yyy D': { probabilityPercent: 10 } },
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
    it('02 stat', () => {
        const countExperiments = 1e3;
        const path = 'RU.desktop';

        const modulesConfig = getModulesConfig(path);
        if (!modulesConfig) throw new Error(`Отсутствуют данные о конфигурации в "${path}"`);
        console.log(modulesConfig);

        const stat: Record<ModuleType, Record<ModuleId, number>> = {};
        for (let i = 0; i < countExperiments; i++) {
            const modules = getRandomModules(modulesConfig);
            addStat(stat, modules);
        }
        console.log({ countExperiments, path, stat });
    });

    /**
     *
     */
    it('03 stat optimized', () => {
        const countExperiments = 1e3;
        const path = 'RU.desktop';

        const modulesConfig = getModulesConfig(path);
        if (!modulesConfig) throw new Error(`Отсутствуют данные о конфигурации в "${path}"`);
        console.log(modulesConfig);

        const stat: Record<ModuleType, Record<ModuleId, number>> = {};
        for (let i = 0; i < countExperiments; i++) {
            const modules = getRandomModulesOptimized(modulesConfig);
            addStat(stat, modules);
        }
        console.log({ countExperiments, path, stat });
    });
});

/**
 *
 */
function addStat(stat: Record<ModuleType, Record<ModuleId, number>>, modules: { type: ModuleType; name: ModuleId; }[]): void {
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

/**
 *
 */
function getModulesConfig(path: Path): Record<ModuleType, Record<ModuleId, Module>>|undefined {
    return get(CONFIG, path);
}

/**
 *
 */
function getModuleProbabilityPercent(module: Module): number {
    return module.probabilityPercent;
}

/**
 * https://translated.turbopages.org/proxy_u/en-ru.ru.0c28581d-67bc7084-be0b9f72-74722d776562/https/stackoverflow.com/questions/1761626/weighted-random-numbers
 */
function getRandomModuleId(moduleConfig: Record<ModuleId, Module>): ModuleId|undefined {
    const SUM_OF_PROBABILITIES_PERCENT = 100;
    let rnd = Math.random() * SUM_OF_PROBABILITIES_PERCENT;
    for (const [moduleId, module] of Object.entries(moduleConfig)) {
        const moduleProbabilityPercent = getModuleProbabilityPercent(module);
        // console.log({ rnd, moduleId, moduleProbabilityPercent });
        if (rnd < moduleProbabilityPercent) return moduleId;
        rnd -= moduleProbabilityPercent;
    }
}

/**
 * Если модулей для каждого типа много, можно добавить двоичный поиск
 */
function getRandomModuleIdOptimized(moduleConfig: Record<ModuleId, Module>): ModuleId|undefined {
    const SUM_OF_PROBABILITIES_PERCENT = 100;
    let rnd = Math.random() * SUM_OF_PROBABILITIES_PERCENT;

    const modulesWithCumulative: Record<ModuleId, number> = {};
    let cumulativeProbabilityPercent = 0;
    for (const [moduleId, module] of Object.entries(moduleConfig)) {
        const moduleProbabilityPercent = getModuleProbabilityPercent(module);
        cumulativeProbabilityPercent += moduleProbabilityPercent;
        modulesWithCumulative[moduleId] = cumulativeProbabilityPercent;
    }
    /* TODO: упорядочен по cumulativeProbabilityPercent, поэтому возможен двоичный поиск */
    for (const [moduleId, cumulativeProbabilityPercent] of Object.entries(modulesWithCumulative)) {
        // console.log({ rnd, moduleId, cumulativeProbabilityPercent });
        if (rnd < cumulativeProbabilityPercent) return moduleId;
    }
}

/**
 *
 */
function getRandomModules(modulesConfig: object): { type: ModuleType; name: ModuleId; }[] {
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

/**
 *
 */
function getRandomModulesOptimized(modulesConfig: object): { type: ModuleType; name: ModuleId; }[] {
    const modules = [];
    for (const [moduleType, moduleConfig] of Object.entries(modulesConfig)) {
        const moduleId = getRandomModuleIdOptimized(moduleConfig);
        if (moduleId) modules.push({
            type: moduleType,
            name: moduleId,
        });
    }
    return modules;
}
