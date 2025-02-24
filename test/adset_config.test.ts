type ModuleId = string;
type ModuleType = string;

interface Module {
    probabilityPercent: number;
}

const CONFIG = {
    root: {
        childrenArg: 'geo',
        probabilityPercent: 100,
        children: {
            'RU': {
                childrenArg: 'device',
                probabilityPercent: 50,
                children: {
                    'mobile': {
                        probabilityPercent: 50,
                        moduleTypes: {
                            'Push': {
                                modules: { 'Push X': { probabilityPercent: 80 }, 'Push Y': { probabilityPercent: 20 } },
                            },
                            'Monetization': {
                                modules: { 'Subscription': { probabilityPercent: 100 } },
                            },
                        },
                    },
                    'desktop': {
                        probabilityPercent: 50,
                        moduleTypes: {
                            'Push': {
                                modules: { 'Push X': { probabilityPercent: 81 }, 'Push Y': { probabilityPercent: 19 } },
                            },
                            'Monetization': {
                                modules: { 'Subscription': { probabilityPercent: 100 } },
                            },
                            'Xxx': {
                                modules: { 'Xxx A': { probabilityPercent: 0 }, 'Xxx B': { probabilityPercent: 10 }, 'Xxx C': { probabilityPercent: 30 }, 'Xxx D': { probabilityPercent: 60 } },
                            },
                            'Yyy': {
                                modules: { 'Yyy A': { probabilityPercent: 0 }, 'Yyy B': { probabilityPercent: 60 }, 'Yyy C': { probabilityPercent: 30 }, 'Yyy D': { probabilityPercent: 10 } },
                            },
                        },
                    },
                },
            },
            'US': {
                childrenArg: 'device',
                probabilityPercent: 50,
                children: {
                    'mobile': {
                        probabilityPercent: 50,
                        children: {},
                    },
                    'desktop': {
                        probabilityPercent: 50,
                        children: {},
                    },
                },
            },
        },
    }
};

/**
 *
 */
describe('AdSet config', () => {

    /**
     *
     */
    it('04 advanced', () => {
        const args: Record<string, any> = {
            geo: 'RU',
            device: 'desktop',
        };

        const modules = getModules(args);

        const result = {
            'adset_id': 83476,
            modules,
        };
        console.log(result);
    });

    /**
     *
     */
    it('041', () => {
        const args: Record<string, any> = {};

        const modules = getModules(args);

        const result = {
            'adset_id': 83476,
            modules,
        };
        console.log(result);
    });

    /**
     *
     */
    it('05 stat', () => {
        const countExperiments = 1e3;
        const args: Record<string, any> = {
            geo: 'RU',
            device: 'desktop',
        };

        const stat: Record<ModuleType, Record<ModuleId, number>> = {};
        for (let i = 0; i < countExperiments; i++) {
            const modules = getModules(args);
            addStat(stat, modules);
        }
        console.log({ countExperiments, args, stat });
    });
});

/**
 *
 */
function getModules(args: Record<string, any>) {
    let modules: { type: ModuleType; name: ModuleId; }[] = [];

    let node: Record<string, any>|undefined = CONFIG['root'];
    do {
        if (!node) throw new Error(`Не найдена информация о модулях`);

        if (node['moduleTypes']) {
            modules = getRandomModules(node['moduleTypes']);
            break;
        }

        const childrenArg: any = node['childrenArg'];
        const existChildrenArg = childrenArg && args[childrenArg];
        if (existChildrenArg) {
            const nodeId: any = args[childrenArg];
            node = node['children'][nodeId];
        } else {
            node = getRandomChildNode(node);
        }
    } while (true);

    return modules;
}

/**
 * https://translated.turbopages.org/proxy_u/en-ru.ru.0c28581d-67bc7084-be0b9f72-74722d776562/https/stackoverflow.com/questions/1761626/weighted-random-numbers
 */
function getRandomKey(probabilitiesPercentPerKey: Record<string, number>): string|undefined {
    const SUM_OF_PROBABILITIES_PERCENT = 100;
    let rnd = Math.random() * SUM_OF_PROBABILITIES_PERCENT;
    for (const [key, probabilityPercent] of Object.entries(probabilitiesPercentPerKey)) {
        // console.log({ rnd, key, probabilityPercent });
        if (rnd < probabilityPercent) return key;
        rnd -= probabilityPercent;
    }

    /*
    Если ключей для каждого типа много, можно добавить двоичный поиск

    const modulesWithCumulative: Record<string, number> = {};
    let cumulativeProbabilityPercent = 0;
    for (const [key, probabilityPercent] of Object.entries(probabilitiesPercentPerKey)) {
        cumulativeProbabilityPercent += probabilityPercent;
        modulesWithCumulative[key] = cumulativeProbabilityPercent;
    }
    for (const [moduleId, cumulativeProbabilityPercent] of Object.entries(modulesWithCumulative)) {
        if (rnd < cumulativeProbabilityPercent) return moduleId;
    }
    */
}

/**
 *
 */
function getRandomChildNode(node: Record<string, any>): Record<string, any>|undefined {
    const children: Record<string, any> = node['children'];
    if (!children) return undefined;

    const probabilitiesPercentPerKey = Object.entries(children).reduce<Record<string, number>>((acc, [nodeId, node]) => {
        acc[nodeId] = node.probabilityPercent;
        return acc;
    }, {});
    const nodeId = getRandomKey(probabilitiesPercentPerKey);

    return nodeId ? children[nodeId] : undefined;
}

/**
 *
 */
function getRandomModuleId(moduleConfig: Record<ModuleId, Module>): ModuleId|undefined {
    const probabilitiesPercentPerKey = Object.entries(moduleConfig).reduce<Record<string, number>>((acc, [moduleId, module]) => {
        acc[moduleId] = module.probabilityPercent;
        return acc;
    }, {});
    const moduleId = getRandomKey(probabilitiesPercentPerKey);
    return moduleId;
}

/**
 *
 */
function getRandomModules(modulesConfig: object): { type: ModuleType; name: ModuleId; }[] {
    const modules = [];
    for (const [moduleType, moduleConfig] of Object.entries(modulesConfig)) {
        const moduleId = getRandomModuleId(moduleConfig['modules']);
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
