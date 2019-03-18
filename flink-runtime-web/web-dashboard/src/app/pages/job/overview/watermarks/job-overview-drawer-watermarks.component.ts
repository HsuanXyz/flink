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
import { NodesItemCorrectInterface } from 'interfaces';
import { JobService, MetricsService } from 'services';

@Component({
  selector       : 'flink-job-overview-drawer-watermarks',
  templateUrl    : './job-overview-drawer-watermarks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls      : [ './job-overview-drawer-watermarks.component.less' ]
})
export class JobOverviewDrawerWatermarksComponent implements OnInit, OnDestroy {
  @Input() node: NodesItemCorrectInterface;
  destroy$ = new Subject();
  listOfWaterMark: Array<{ subTaskIndex: string; watermark: number }> = [];
  isLoading = true;

  trackWatermarkBy(_: number, node: { subTaskIndex: string; watermark: number }) {
    return node.subTaskIndex;
  }

  constructor(private jobService: JobService, private metricsService: MetricsService) {
  }

  ngOnInit() {
    this.jobService.jobDetail$.pipe(
      takeUntil(this.destroy$),
      flatMap((job) => this.metricsService.getWatermarks(job.jid, this.node.id, this.node.parallelism))
    ).subscribe(data => {
      const list = [];
      this.isLoading = false;
      for (const key in data.watermarks) {
        list.push({
          subTaskIndex: key,
          watermark   : data.watermarks[ key ]
        });
      }
      this.listOfWaterMark = list;
    }, () => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
