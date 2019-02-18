declare namespace Merge {
    type Operator = '!' | '&' | '!' | '=' | '?' | '+' | '|' | '-' | '^' | '*';
    interface ReturnValue<T extends any = any> {
        data: any
        state: T & State
    }

    type Function = (lhs: ReturnValue, rhs: any) => ReturnValue

    interface State {
        merge?: {
            operator?: Operator
            handleObject?: Merge.Function
            handleAny?: Merge.Function
        }
    }
}