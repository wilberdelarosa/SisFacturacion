/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        /* RULES FOR HEXAGONAL ARCHITECTURE */
        {
            name: 'domain-no-dependencies',
            severity: 'error',
            comment: 'Domain code MUST NOT depend on application, adapters, or infrastructure.',
            from: { path: "^services/[^/]+/src/domain" },
            to: {
                path: ["^services/[^/]+/src/application", "^services/[^/]+/src/adapters", "^services/[^/]+/src/infrastructure"]
            }
        },
        {
            name: 'application-no-infrastructure',
            severity: 'error',
            comment: 'Application use cases should not depend on infrastructure details directly.',
            from: { path: "^services/[^/]+/src/application" },
            to: {
                path: ["^services/[^/]+/src/infrastructure", "^services/[^/]+/src/adapters"]
            }
        },
        {
            name: 'no-circular',
            severity: 'warn',
            comment: 'Circular dependencies can cause bugs.',
            from: {},
            to: {
                circular: true
            }
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules',
            dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg']
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: './tsconfig.base.json'
        },
        enhancedResolveOptions: {
            exportsFields: ['exports'],
            conditionNames: ['import', 'require', 'node', 'default']
        },
        reporterOptions: {
            dot: {
                collapsePattern: 'node_modules/[^/]+',
            },
            archi: {
                collapsePattern: '^(node_modules|packages|services|apps)[/][^/]+',
            }
        }
    }
};
