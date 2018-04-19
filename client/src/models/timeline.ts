import * as moment from 'moment';
import { TrackItemService } from '../services/TrackItemService';
import { AppSettingService } from '../services/AppSettingService';
import { TrackItemType } from '../enum/TrackItemType';
import { ITrackItem } from '../@types/ITrackItem';
import { ITimelineState } from '../@types/ITimelineState';

const handleTimelineItems = (
    state: ITimelineState,
    payload: {
        appTrackItems: object;
        logTrackItems: object;
        statusTrackItems: object;
    },
): ITimelineState => {
    return {
        ...state,
        [TrackItemType.AppTrackItem]: payload.appTrackItems,
        [TrackItemType.LogTrackItem]: payload.logTrackItems,
        [TrackItemType.StatusTrackItem]: payload.statusTrackItems,
    };
};

const addToTimelineItems = (
    state: ITimelineState,
    payload: {
        appItems: ITrackItem[];
        logItems: ITrackItem[];
        statusItems: ITrackItem[];
    },
): ITimelineState => {
    return {
        ...state,
        [TrackItemType.AppTrackItem]: [...state[TrackItemType.AppTrackItem], ...payload.appItems],
        [TrackItemType.LogTrackItem]: [...state[TrackItemType.LogTrackItem], ...payload.logItems],
        [TrackItemType.StatusTrackItem]: [
            ...state[TrackItemType.StatusTrackItem],
            ...payload.statusItems,
        ],
    };
};

export const timelineModel: any = {
    namespace: 'timeline',
    state: {
        AppTrackItem: [],
        StatusTrackItem: [],
        LogTrackItem: [],
        timerange: [
            moment()
                .subtract(1, 'days')
                .toDate(),
            new Date(),
        ],
        visibleTimerange: [
            moment()
                .subtract(1, 'hour')
                .toDate(),
            new Date(),
        ],
        selectedTimelineItem: null,
    },
    subscriptions: {
        setup({ dispatch }: any) {
            console.log('Timeline data setup');

            const beginDate = moment()
                .startOf('day')
                .toDate();
            const endDate = moment()
                .endOf('day')
                .toDate();
            dispatch({
                type: 'loadTimerange',
                payload: { timerange: [beginDate, endDate] },
            });
        },
    },

    effects: {
        *changeVisibleTimerange({ payload: { visibleTimerange } }: any, { call, put }: any) {
            console.log('Visible timerange changed:', visibleTimerange);
            yield put({
                type: 'setVisibleTimerange',
                payload: { visibleTimerange },
            });
        },

        *saveTimelineItem({ payload: { item, colorScope } }: any, { call, put, select }: any) {
            console.log('Updating color for trackItem', item, colorScope);
            if (colorScope === 'ALL_ITEMS') {
                yield AppSettingService.changeColorForApp(item.app, item.color);
                yield TrackItemService.updateColorForApp(item.app, item.color);
            } else if (colorScope === 'NEW_ITEMS') {
                yield AppSettingService.changeColorForApp(item.app, item.color);
                yield TrackItemService.saveTrackItem(item);
            } else {
                yield TrackItemService.saveTrackItem(item);
            }

            yield put({
                type: 'selectTimelineItem',
                payload: { item: null },
            });
            const timerange = yield select(state => state.timeline.timerange);
            yield put({
                type: 'loadTimerange',
                payload: { timerange },
            });
        },
        *loadTimerange({ payload: { timerange } }: any, { call, put }: any) {
            console.log('Change timerange:', timerange);

            const { appItems, statusItems, logItems } = yield call(
                TrackItemService.findAllItems,
                timerange[0],
                timerange[1],
            );

            console.error(appItems);

            yield put({
                type: 'loadTimelineItems',
                payload: {
                    logTrackItems: logItems,
                    statusTrackItems: statusItems,
                    appTrackItems: appItems,
                },
            });
            yield put({
                type: 'setTimerange',
                payload: { timerange },
            });
        },
    },
    reducers: {
        loadTimelineItems(state: any, { payload }: any) {
            return handleTimelineItems(state, payload);
        },

        addToTimeline(state: any, { payload }: any) {
            console.log('Add to timeline:', payload);
            return addToTimelineItems(state, payload);
        },
        setTimerange(state: any, { payload: { timerange } }: any) {
            return {
                ...state,
                timerange,
            };
        },
        setVisibleTimerange(state: any, { payload: { visibleTimerange } }: any) {
            return {
                ...state,
                visibleTimerange,
            };
        },
        selectTimelineItem(state: any, { payload: { item } }: any) {
            if (item) {
                console.log('Selected timeline item:', item.data().toJS());
            } else {
                console.log('Deselected timeline item');
            }

            return {
                ...state,
                selectedTimelineItem: item,
            };
        },
    },
};
