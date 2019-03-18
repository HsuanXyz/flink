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

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { first, skip, takeUntil } from 'rxjs/operators';
import { NodesItemCorrectInterface, NodesItemLinkInterface } from 'interfaces';
import { JobService } from 'services';
import { DagreComponent } from 'share/common/dagre/dagre.component';

@Component({
  selector       : 'flink-job-overview',
  templateUrl    : './job-overview.component.html',
  styleUrls      : [ './job-overview.component.less' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobOverviewComponent implements OnInit, OnDestroy {
  @ViewChild(DagreComponent) dagreComponent: DagreComponent;
  nodes: NodesItemCorrectInterface[] = [];
  links: NodesItemLinkInterface[] = [];
  destroy$ = new Subject();
  selectedNode: NodesItemCorrectInterface | null;
  top = 500;

  onNodeClick(node: NodesItemCorrectInterface) {
    this.router.navigate([ node.id ], { relativeTo: this.activatedRoute }).then();
  }

  onResizeEnd() {
    if (!this.selectedNode) {
      this.dagreComponent.moveToCenter();
    } else {
      this.dagreComponent.focusNode(this.selectedNode, true);
    }
  }

  constructor(
    private jobService: JobService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public elementRef: ElementRef,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.jobService.jobDetail$.pipe(
      takeUntil(this.destroy$),
      first()
    ).subscribe(data => {
      this.nodes = data.plan.nodes;
      this.links = data.plan.links;
      this.dagreComponent.flush(this.nodes, this.links, true);
      this.cdr.markForCheck();
    });
    this.jobService.jobDetail$.pipe(
      takeUntil(this.destroy$),
      skip(1)
    ).subscribe(data => {
      this.nodes = data.plan.nodes;
      this.nodes.forEach(node => {
        this.dagreComponent.updateNode(node.id, node);
      });
    });
    this.jobService.selectedVertexNode$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.selectedNode = data;
      if (this.selectedNode) {
        this.dagreComponent.focusNode(this.selectedNode);
      } else {
        this.dagreComponent.redrawGraph();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.jobService.selectedVertexNode$.next(null);
  }
}
