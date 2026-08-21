import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Cliente } from '../../../core/models/cliente.model';
import { INTERESSE_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-cliente-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, DatePipe],
  templateUrl: './cliente-detail-dialog.html',
})
export class ClienteDetailDialog {
  protected readonly cliente = inject<Cliente>(MAT_DIALOG_DATA);
  protected readonly interesseLabels = INTERESSE_LABELS;
}
