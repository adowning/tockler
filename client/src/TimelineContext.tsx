import * as React from 'react';
import moment from 'moment';
import { TrackItemService } from './services/TrackItemService';
import { setDayFromTimerange, getTodayTimerange } from './components/Timeline/timeline.utils';

export const TimelineContext = React.createContext<any>({});

const emptyTimeItems = {
    appItems: [],
    logItems: [],
    statusItems: [],
};

export const TimelineProvider = ({ children }) => {
    const [timerange, setTimerange] = React.useState<any>(getTodayTimerange());
    const [visibleTimerange, setVisibleTimerange] = React.useState<any>([
        moment().subtract(1, 'hour'),
        moment(),
    ]);

    const [timeItems, setTimeItems] = React.useState<any>(emptyTimeItems);

    const loadTimerange = async timerange => {
        console.info('Loading timerange:', JSON.stringify(timerange));

        const { appItems, statusItems, logItems } = await TrackItemService.findAllItems(
            timerange[0],
            timerange[1],
        );

        setTimeItems({ appItems, statusItems, logItems });
        setTimerange(timerange);
        setVisibleTimerange(setDayFromTimerange(visibleTimerange, timerange));
    };

    const defaultContext = {
        timerange,
        setTimerange,
        timeItems,
        setTimeItems,
        loadTimerange,
        visibleTimerange,
        setVisibleTimerange,
    };

    React.useEffect(() => {
        loadTimerange(timerange);
    }, []);

    return <TimelineContext.Provider value={defaultContext}>{children}</TimelineContext.Provider>;
};