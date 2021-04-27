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
    setAsEventRevenue: string | undefined
    doEmitEvent: boolean
    eventTriggers: EventTrigger[]
    appIdField: string | undefined
    afIdField: string | undefined
    version: string | undefined
    afEventName: string
    predictorEventName: string
    afDevKeyAndroid: string
    adDevKeyIos: string

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
    logic: string // параметр на будущее. Сейчас по дефолту предикт ставиться в by, если by больше значения предикта
}

// export interface UserSmartClass

export type PredictedDataStruct = Array<object>