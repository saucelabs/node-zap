module.exports = {
    globals: {
        'ts-jest': {
            isolatedModules: true
        }
    },
    testMatch: [
        '**/tests/**/*.test.ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/'
    ],
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 91,
            functions: 97,
            lines: 98,
            statements: 98
        }
    },
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        'node_modules/'
    ]
}
