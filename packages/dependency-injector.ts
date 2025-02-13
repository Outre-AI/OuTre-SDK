type Token<T> = string | symbol;

interface DependencyContainer {
    register<T>(token: Token<T>, provider: DependencyProvider<T>): void;
    resolve<T>(token: Token<T>): T;
}

interface DependencyProvider<T> {
    get(): T;
}

class SimpleInjector implements DependencyContainer {
    private providers = new Map<Token<any>, DependencyProvider<any>>();

    register<T>(token: Token<T>, provider: DependencyProvider<T>): void {
        if (this.providers.has(token)) {
            throw new Error(`Provider for token ${String(token)} is already registered.`);
        }
        this.providers.set(token, provider);
    }

    resolve<T>(token: Token<T>): T {
        const provider = this.providers.get(token);
        if (!provider) {
            throw new Error(`No provider found for token: ${String(token)}`);
        }
        return provider.get();
    }
}

class ValueProvider<T> implements DependencyProvider<T> {
    constructor(private value: T) { }
    get(): T {
        return this.value;
    }
}

class SingletonProvider<T> implements DependencyProvider<T> {
    private instance: T | null = null;
    constructor(private factory: () => T) { }
    get(): T {
        if (!this.instance) {
            this.instance = this.factory();
        }
        return this.instance;
    }
}

class FactoryProvider<T> implements DependencyProvider<T> {
    constructor(private factory: () => T) { }
    get(): T {
        return this.factory();
    }
}

class ScopedProvider<T> implements DependencyProvider<T> {
    private instances = new Map<string, T>();
    constructor(private factory: (scope: string) => T) { }
    get(scope: string): T {
        if (!this.instances.has(scope)) {
            this.instances.set(scope, this.factory(scope));
        }
        return this.instances.get(scope)!;
    }
}

export {
    Token,
    DependencyContainer,
    DependencyProvider,
    SimpleInjector,
    ValueProvider,
    SingletonProvider,
    FactoryProvider,
    ScopedProvider
};
