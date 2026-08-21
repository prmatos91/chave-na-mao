import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Veiculo } from '../../../core/models/veiculo.model';
import { STATUS_VEICULO_COLOR, STATUS_VEICULO_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-veiculo-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CurrencyPipe, DecimalPipe, DatePipe],
  templateUrl: './veiculo-detail-dialog.html',
})
export class VeiculoDetailDialog {
  protected readonly veiculo = inject<Veiculo>(MAT_DIALOG_DATA);
  protected readonly statusLabels = STATUS_VEICULO_LABELS;
  protected readonly statusColor = STATUS_VEICULO_COLOR;
}
