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

import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import { flatMap, takeUntil } from 'rxjs/operators';
import { NodesItemCorrectInterface, SubTaskAccumulatorsInterface, UserAccumulatorsInterface } from 'interfaces';
import { JobService } from 'services';

@Component({
  selector       : 'flink-job-overview-drawer-accumulators',
  templateUrl    : './job-overview-drawer-accumulators.component.html',
  styleUrls      : [ './job-overview-drawer-accumulators.component.less' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobOverviewDrawerAccumulatorsComponent implements OnInit, OnDestroy {
  @Input() node: NodesItemCorrectInterface;
  destroy$ = new Subject();
  listOfAccumulator: UserAccumulatorsInterface[] = [];
  listOfSubTaskAccumulator: SubTaskAccumulatorsInterface[] = [];
  isLoading = true;

  trackAccumulatorBy(_: number, node: UserAccumulatorsInterface | SubTaskAccumulatorsInterface) {
    return node.name;
  }

  constructor(private jobService: JobService) {
  }

  ngOnInit() {
    this.jobService.jobDetail$.pipe(
      takeUntil(this.destroy$),
      flatMap((job) => this.jobService.loadAccumulators(job.jid, this.node.id))
    ).subscribe(data => {
      this.isLoading = false;
      this.listOfAccumulator = data.main;
      this.listOfSubTaskAccumulator = data.subtasks[ 'user-accumulators' ] || [];
    }, () => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
