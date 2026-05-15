import { activityRepository } from '../repositories/activity.repository.js';
export const activityService = {
    list(filters) {
        return activityRepository.list(filters);
    },
    record(input) {
        return activityRepository.create(input);
    },
};
