module.exports = {
    api: {
        output: {
            mode: 'split',
            target: './src/api/generated/api.ts',
            schemas: './src/api/generated/models',
            client: 'react-query',
            mock: true,
            prettier: true,
            override: {
                mutator: {
                    path: './src/api/mutator.ts',
                    name: 'mutator',
                },
                queryOptions: {
                    useQuery: true,
                    useInfinite: true,
                    useInfiniteQueryParam: 'offset',
                    options: {
                        staleTime: 10000,
                    },
                },
            },
        },
        input: {
            target: 'http://127.0.0.1:7300/openapi.json',
        },
    },
}; 