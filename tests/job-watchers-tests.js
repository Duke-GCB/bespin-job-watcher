"use strict";
/**
 * Created by jpb67 on 2/3/17.
 */
const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const JobWatchers = require('./../job-watchers');

const watcher1 = {
    'value': 1,
    notifyData: '',
    notify(data) {
        this.notifyData = data;
    }
};
const watcher2 = {
    'value': 4,
    notifyData: '',
    notify(data) {
        this.notifyData = data;
    }
};

const jobKey1 = '1';
const jobKey2 = '2';

function addNotifyData(watcher, data) {
    watcher.notifyData = data;
}

describe('JobWatchers', function() {
    it('add() can stores multiple watchers for the same job id', function() {
        const jobWatchers = JobWatchers();
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey1, watcher2);
        const job1Watchers = jobWatchers.jobIdToWatcher[jobKey1];
        expect(job1Watchers[0]).to.equal(watcher1);
        expect(job1Watchers[1]).to.equal(watcher2);
    });
    it('add() can stores multiple watchers for the different job ids', function() {
        const jobWatchers = JobWatchers();
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey1, watcher2);
        jobWatchers.add(jobKey2, watcher2);
        const job1Watchers = jobWatchers.jobIdToWatcher[jobKey1];
        expect(job1Watchers.length).to.equal(2);
        expect(job1Watchers[0]).to.equal(watcher1);
        expect(job1Watchers[1]).to.equal(watcher2);
        const job2Watchers = jobWatchers.jobIdToWatcher[jobKey2];
        expect(job2Watchers.length).to.equal(1);
        expect(job2Watchers[0]).to.equal(watcher2);
    });
    it('add() will not duplicate items already setup', function() {
        const jobWatchers = JobWatchers();
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey1, watcher1);
        const job1Watchers = jobWatchers.jobIdToWatcher[jobKey1];
        expect(job1Watchers.length).to.equal(1);
    });
    it('remove() can will remove that jobId/watcher combination', function() {
        const jobWatchers = JobWatchers();
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey1, watcher2);
        jobWatchers.remove(jobKey1, watcher1);
        let job1Watchers = jobWatchers.jobIdToWatcher[jobKey1];
        expect(job1Watchers.length).to.equal(1);
        expect(job1Watchers[0]).to.equal(watcher2);
        // JobWatcher doesn't complain if not found
        jobWatchers.remove(jobKey1, watcher1);
        job1Watchers = jobWatchers.jobIdToWatcher[jobKey1];
        expect(job1Watchers.length).to.equal(1);
        expect(job1Watchers[0]).to.equal(watcher2);
        jobWatchers.remove(jobKey1, watcher2);
        //job1Watchers = jobWatchers.jobIdToWatcher[jobKey1];
        //expect(job1Watchers.length).to.equal(0);
        expect([]).to.deep.equal(Object.keys(jobWatchers.jobIdToWatcher));
    });
    it('remove() should remove the key from internal dictionary when empty', function() {
        const jobWatchers = JobWatchers();
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.remove(jobKey1, watcher1);
        expect([]).to.deep.equal(Object.keys(jobWatchers.jobIdToWatcher));
    });
    it('removeForAllJobIds() removes watcher under all job ids', function() {
        const jobWatchers = JobWatchers();
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey1, watcher2);
        jobWatchers.add(jobKey2, watcher2);
        expect(jobWatchers.jobIdToWatcher[jobKey1].length).to.equal(2);
        expect(jobWatchers.jobIdToWatcher[jobKey2].length).to.equal(1);
        jobWatchers.removeForAllJobIds(watcher2);
        expect(Object.keys(jobWatchers.jobIdToWatcher)).to.deep.equal([jobKey1]);
        expect(jobWatchers.jobIdToWatcher[jobKey1]).to.deep.equal([watcher1]);
    });
    it('notify() can call watcher.notify(data) for two watchers with the same key', function() {
        const jobWatchers = JobWatchers(addNotifyData);
        watcher1.notifyData = '';
        watcher2.notifyData = '';
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey1, watcher2);
        jobWatchers.notify(jobKey1, "Hey");
        expect(watcher1.notifyData).to.equal("Hey");
        expect(watcher2.notifyData).to.equal("Hey");
    });
    it('notify() can call watcher.notify(data) for one watcher', function() {
        const jobWatchers = JobWatchers(addNotifyData);
        watcher1.notifyData = '';
        watcher2.notifyData = '';
        jobWatchers.add(jobKey1, watcher1);
        jobWatchers.add(jobKey2, watcher2);
        jobWatchers.notify(jobKey1, "Testing");
        expect(watcher1.notifyData).to.equal("Testing");
        expect(watcher2.notifyData).to.equal("");
    });
});