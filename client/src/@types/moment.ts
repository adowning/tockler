import moment from 'moment';

moment();
declare module 'moment' {
    namespace duration {
        const fn: Duration;
    }

    interface Duration {
        format: Format;
    }

    interface Format {
        defaults: DurationFormatSettings;

        (
            template: string | TemplateFunction,
            precision: number,
            settings?: DurationFormatSettings,
        ): string;
        (template: string | TemplateFunction, settings?: DurationFormatSettings): string;
        (settings?: DurationFormatSettings): string;
    }

    type UnitOfTrimV1 = 'left' | 'right';
    type UnitOfTrim = 'large' | 'small' | 'both' | 'mid' | 'all' | 'final';

    interface DurationFormatSettings {
        trim?: false | UnitOfTrimV1 | UnitOfTrim | string | Array<UnitOfTrim | string>;
        largest?: number;
        trunc?: true;
        stopTrim?: string;

        minValue?: number;
        maxValue?: number;

        useGrouping?: boolean;
        precision?: number;
        decimalSeparator?: string;
        groupingSeparator?: string;
        grouping?: number[];

        useSignificantDigits?: true;

        forceLength?: boolean;
        template?: string | TemplateFunction;

        userLocale?: string;
        usePlural?: boolean;
        useLeftUnits?: boolean;
        useToLocaleString?: boolean;
    }

    type DurationLabelType = 'long' | 'standard' | 'short';
    type DurationTemplate = 'HMS' | 'HM' | 'MS';
    type DurationToken =
        | 'S'
        | 'SS'
        | 'SSS'
        | 's'
        | 'ss'
        | 'sss'
        | 'm'
        | 'mm'
        | 'mmm'
        | 'h'
        | 'hh'
        | 'hhh'
        | 'd'
        | 'dd'
        | 'ddd'
        | 'w'
        | 'ww'
        | 'www'
        | 'M'
        | 'MM'
        | 'MMM'
        | 'y'
        | 'yy'
        | 'yyy';

    type DurationLabelDef = { [duration in DurationToken]: string };
    type DurationTimeDef = { [template in DurationTemplate]: string };

    interface DurationLabelTypeDef {
        type: DurationLabelType;
        string: string;
    }

    interface LocaleSpecification {
        durationLabelsLong: DurationLabelDef;
        durationLabelsStandard: DurationLabelDef;
        durationLabelsShort: DurationLabelDef;
        durationTimeTemplates: DurationTimeDef;
        durationLabelTypes: DurationLabelTypeDef[];
        durationPluralKey: (token: string, integerValue: number, decimalValue: number) => string;
    }

    type TemplateFunction = (this: DurationFormatSettings) => string;
}
