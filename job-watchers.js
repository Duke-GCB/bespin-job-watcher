'use strict';

/**
 * Runs notifyFunc on watchers associated with a jobId when notify is called for that jobId.
 * @param notifyFunc func(watcher, data)
 * @constructor
 */
function JobWatchers(notifyFunc) {
    return {
        notifyFunc: notifyFunc,
        jobIdToWatcher: {},
        add(jobId, watcher) {
            const watchers = this.jobIdToWatcher[jobId] || [];
            if (watchers.indexOf(watcher) === -1) {
                watchers.push(watcher);
                this.jobIdToWatcher[jobId] = watchers;
            }
        },
        remove(jobId, watcher) {
            const watchers = this.jobIdToWatcher[jobId];
            if (watchers) {
                const watcherIndex = watchers.indexOf(watcher);
                if (watcherIndex != -1) {
                    watchers.splice(watcherIndex, 1);
                }
                if (watchers.length == 0) {
                    delete this.jobIdToWatcher[jobId];
                }
            }
        },
        removeForAllJobIds(watcher) {
            for (let jobId in this.jobIdToWatcher) {
                this.remove(jobId, watcher);
            }
        },
        notify(jobId, data) {
            const watchers = this.jobIdToWatcher[jobId];
            if (watchers) {
                for (let i = 0; i < watchers.length; i++) {
                    this.notifyFunc(watchers[i], data);
                }
            }
        }
    }
}

module.exports = JobWatchers;