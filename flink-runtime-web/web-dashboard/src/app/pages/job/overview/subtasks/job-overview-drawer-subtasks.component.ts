/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Input, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { flatMap, takeUntil } from 'rxjs/operators';
import { deepFind } from 'utils';
import { NodesItemCorrectInterface, JobSubTaskInterface } from 'interfaces';
import { JobService } from 'services';

@Component({
  selector       : 'flink-job-overview-drawer-subtasks',
  templateUrl    : './job-overview-drawer-subtasks.component.html',
  styleUrls      : [ './job-overview-drawer-subtasks.component.less' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobOverviewDrawerSubtasksComponent implements OnInit, OnDestroy {
  @Input() node: NodesItemCorrectInterface;
  listOfTask: JobSubTaskInterface[] = [];
  destroy$ = new Subject();
  sortName: string;
  sortValue: string;
  isLoading = true;

  trackTaskBy(_: number, node: JobSubTaskInterface) {
    return node.attempt;
  }

  sort(sort: { key: string, value: string }) {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    this.search();
  }

  search() {
    if (this.sortName) {
      this.listOfTask = [ ...this.listOfTask.sort(
        (pre, next) => {
          if (this.sortValue === 'ascend') {
            return (deepFind(pre, this.sortName) > deepFind(next, this.sortName) ? 1 : -1);
          } else {
            return (deepFind(next, this.sortName) > deepFind(pre, this.sortName) ? 1 : -1);
          }
        }) ];
    }
  }

  constructor(private jobService: JobService) {
  }

  ngOnInit() {
    this.jobService.jobDetail$.pipe(
      takeUntil(this.destroy$),
      flatMap((job) => this.jobService.loadSubTasks(job.jid, this.node.id))
    ).subscribe(data => {
      this.listOfTask = data;
      this.isLoading = false;
      this.search();
    }, () => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
