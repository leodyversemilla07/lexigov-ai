export const api = new Proxy(
    {},
    {
        get(_, moduleName) {
            return new Proxy(
                {},
                {
                    get(_, fnName) {
                        const path = `${String(moduleName)}.${String(fnName)}`;
                        return {
                            __convexFnPath: path,
                            toString: () => path,
                        };
                    },
                },
            );
        },
    },
);

export const internal = api;
