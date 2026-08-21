import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Oportunidade } from '../../../core/models/oportunidade.model';
import { STATUS_OPORTUNIDADE_COLOR, STATUS_OPORTUNIDADE_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-oportunidade-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CurrencyPipe, DatePipe],
  templateUrl: './oportunidade-detail-dialog.html',
})
export class OportunidadeDetailDialog {
  protected readonly oportunidade = inject<Oportunidade>(MAT_DIALOG_DATA);
  protected readonly statusLabels = STATUS_OPORTUNIDADE_LABELS;
  protected readonly statusColor = STATUS_OPORTUNIDADE_COLOR;
}
