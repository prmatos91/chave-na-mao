import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardResponse } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  STATUS_OPORTUNIDADE_COLOR,
  STATUS_OPORTUNIDADE_LABELS,
  STATUS_VEICULO_COLOR,
  STATUS_VEICULO_LABELS,
} from '../../shared/utils/labels';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, KeyValuePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly data = signal<DashboardResponse | null>(null);
  protected readonly loading = signal(true);

  protected readonly statusVeiculoLabels = STATUS_VEICULO_LABELS;
  protected readonly statusVeiculoColor = STATUS_VEICULO_COLOR;
  protected readonly statusOportunidadeLabels = STATUS_OPORTUNIDADE_LABELS;
  protected readonly statusOportunidadeColor = STATUS_OPORTUNIDADE_COLOR;

  ngOnInit(): void {
    this.dashboardService.buscar().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
