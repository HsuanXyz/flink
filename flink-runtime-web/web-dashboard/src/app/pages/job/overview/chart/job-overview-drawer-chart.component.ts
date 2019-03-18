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

import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy, ViewChildren, QueryList } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, flatMap, takeUntil } from 'rxjs/operators';
import { JobDetailCorrectInterface, NodesItemCorrectInterface } from 'interfaces';
import { JobService, MetricsService } from 'services';
import { JobChartComponent } from 'share/customize/job-chart/job-chart.component';

@Component({
  selector       : 'flink-job-overview-drawer-chart',
  templateUrl    : './job-overview-drawer-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls      : [ './job-overview-drawer-chart.component.less' ]
})
export class JobOverviewDrawerChartComponent implements OnInit, OnDestroy {
  destroy$ = new Subject();
  data = [];
  listOfMetricName: string[] = [];
  listOfSelectedMetric: string[] = [];
  listOfUnselectedMetric: string[] = [];
  innerNode: NodesItemCorrectInterface;
  jobDetail: JobDetailCorrectInterface;
  @ViewChildren(JobChartComponent) listOfJobChartComponent: QueryList<JobChartComponent>;

  @Input()
  set node(value: NodesItemCorrectInterface) {
    if (this.innerNode && (value.id !== this.innerNode.id)) {
      this.loadMetricList();
    }
    this.innerNode = value;
  }

  get node() {
    return this.innerNode;
  }

  loadMetricList() {
    this.metricsService.getAllAvailableMetrics(this.jobDetail.jid, this.node.id).subscribe(data => {
      this.listOfMetricName = data.map(item => item.id);
      this.listOfSelectedMetric = [];
      this.updateUnselectedMetricList();
    });
  }

  updateMetric(metric: string) {
    this.listOfSelectedMetric = [ ...this.listOfSelectedMetric, metric ];
    this.updateUnselectedMetricList();
  }

  closeMetric(metric: string) {
    this.listOfSelectedMetric = this.listOfSelectedMetric.filter(item => item !== metric);
    this.updateUnselectedMetricList();
  }

  updateUnselectedMetricList() {
    this.listOfUnselectedMetric = this.listOfMetricName.filter(item => this.listOfSelectedMetric.indexOf(item) === -1);
  }

  constructor(private metricsService: MetricsService, private jobService: JobService) {
  }

  ngOnInit() {
    this.loadMetricList();
    this.jobService.jobDetail$.pipe(
      takeUntil(this.destroy$),
      filter(() => this.listOfSelectedMetric.length > 0),
      flatMap((job) => {
        this.jobDetail = job;
        return this.metricsService.getMetrics(job.jid, this.node.id, this.listOfSelectedMetric);
      })
    ).subscribe((res) => {
      if (this.listOfJobChartComponent && this.listOfJobChartComponent.length) {
        this.listOfJobChartComponent.forEach(chart => {
          chart.refresh(res);
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
