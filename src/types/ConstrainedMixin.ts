export type ConstrainedMixin<T = {}> = new (...args: any[]) => T;
export type GetProps<TBase> = TBase extends new (props: infer P) => any ? P : never
export type GetInstance<TBase> = TBase extends new (...args: any[]) => infer I ? I : never
export type MergeCtor<A, B> = new (props: GetProps<A> & GetProps<B>) => GetInstance<A> & GetInstance<B>
