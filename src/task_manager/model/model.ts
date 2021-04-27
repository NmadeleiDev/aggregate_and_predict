export interface Task {
    name: string
    lastExecutionTime: Date
    
    // параметры для группировки данных
    rawDataSelectQuery: string
    grouperFileName: string
    groupMode: string

    // параметры для генерации прогнозов
    feedTo: {modelName: string, saveAs: string}
    // для корректировки прогнозов
    valueCorrectionDirectives: ValueCorrection[]

    // параметры для отправки ивентов
    doEmitEvent: boolean
    eventTriggers: EventTrigger[]
    appIdField: string
    afIdField: string
    version: string | undefined
    afEventName: string
    predictorEventName: string
    afDevKeyAndroid: string
    adDevKeyIos: string
    setAsEventRevenue: string | undefined

    // параметры для запуска такса по крону
    cronSchedule: string
    launchOnStart: boolean
}

export interface EventTrigger {
    metric: string
    valueType: string
    value: number
    filterType: string
}

export interface ValueCorrection {
    metric: string
    by: string | number
    logic: string
}

// export interface UserSmartClass

export type PredictedDataStruct = Array<object>