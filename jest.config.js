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
            branches: 74,
            functions: 92,
            lines: 89,
            statements: 89
        }
    },
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        'node_modules/'
    ]
}
