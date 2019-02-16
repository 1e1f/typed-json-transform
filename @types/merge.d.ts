declare namespace Merge {
    type Operator = '!' | '&' | '!' | '=' | '?' | '+' | '|' | '-' | '^' | '*';
    interface ReturnValue<T extends any = any> {
        data: any
        state: State<T>
    }

    type Function = (lhs: ReturnValue, rhs: any) => ReturnValue

    interface State<T extends any = any> {
        merge?: {
            operator?: Operator
            handleObject?: Merge.Function
            handleAny?: Merge.Function
        }
    }
}