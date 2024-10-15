import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

interface ApiResponse {
  properties: ApiResponse[];
  type: string,
  mentionText: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'cbo-erp';
  selectedFile: File | null = null;
  fetching = false;
  accessToken = ""
  format1 = ['openingvalue', 'receiptvalue', 'issuevalue', 'closingvalue']
  format2 = ['opening', 'receipt', 'issue', 'closing']

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getAccessToken().subscribe((token: any) => { this.accessToken = token.token.token })
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.selectedFile = target.files[0];
    }
  }

  getAccessToken() {
    return this.http.get<{ token: string }>('http://localhost:3000/generate-token');
  }

  uploadDocument() {
    this.fetching = true;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1]!; // Extract Base64 content
        this.extractColumnAPI(base64String);
      };
    } else {
      console.log('No file selected');
    }
  }

  extractDataAPI(base64String: string, processorID: string) {
    const apiUrl = `https://documentai.googleapis.com/v1/projects/220023639180/locations/us/processors/${processorID}:process`;
    const requestBody = {
      rawDocument: {
        content: base64String,
        mimeType: this.getMimeType(this.selectedFile!.name), // Get the mime type based on file name
      },
    };

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    this.http.post(apiUrl, requestBody, { headers }).subscribe(
      (response: any) => {
        this.fetching = false;
        console.log('API Response:', response.document.entities);
        // this.downloadAsExcel(response.document.entities)
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  extractColumnAPI(base64String: string) {
    const apiUrl = 'https://documentai.googleapis.com/v1/projects/220023639180/locations/us/processors/ed183665dfa20f6f:process';
    const requestBody = {
      rawDocument: {
        content: base64String,
        mimeType: this.getMimeType(this.selectedFile!.name), // Get the mime type based on file name
      },
    };

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    this.http.post(apiUrl, requestBody, { headers }).subscribe(
      (response: any) => {
        this.fetching = false;
        console.log('API Response:', response.document.entities);

        const columns = response.document.entities.slice(0, 4) as ApiResponse[]
        const columnValues = columns.map(obj => Object.values(obj)[2]
          .replace(/\n/g, '')
          .replace(/QTY\.|\.VALUE/g, '')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .toLowerCase().trim()
        )
        console.log(columnValues);

        if (this.isCorrectFormat(columnValues, this.format2)) {
          console.log("Processor 1 called");
          this.extractDataAPI(base64String, "b42a3559de5c510f")
        } else if (this.isCorrectFormat(columnValues, this.format1)) {
          console.log("Processor 2 called");
          this.extractDataAPI(base64String, "f64cafd334ce5afb")
        } else {
          console.log("No processor present for this layout.");
        }

      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  isCorrectFormat(columnValues: string[], format: string[]) {
    const isMatch = columnValues.every((value, index) => {
      return format[index] && format[index].toLowerCase().includes(value?.toLowerCase());
    });
    return isMatch;
  }

  getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return '';
    }
  }

  downloadAsExcel(apiResponse: ApiResponse[]) {
    const dataMap: { [key: string]: string[] } = {};

    apiResponse.forEach(obj => {
      if (obj.type === 'line-item' || obj.type === 'lineItem') {
        obj.properties.forEach(prop => {
          if (!dataMap[prop.type]) {
            dataMap[prop.type] = [];
          }
          dataMap[prop.type].push(prop.mentionText);
        });
      } else {
        if (!dataMap[obj.type]) {
          dataMap[obj.type] = [];
        }
        dataMap[obj.type].push(obj.mentionText);
      }
    });

    const columns = Object.keys(dataMap);
    const maxRows = Math.max(...columns.map(col => dataMap[col].length));

    columns.forEach(col => {
      const firstRowValue = dataMap[col][0] || '';
      for (let i = 0; i < maxRows; i++) {
        if (!dataMap[col][i]) {
          dataMap[col][i] = firstRowValue;
        }
      }
    });

    const worksheetData: any[][] = [];
    worksheetData.push(columns);

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      const row: any[] = [];
      columns.forEach(col => {
        row.push(dataMap[col][rowIndex] || '');  // Fill in data row-wise
      });
      worksheetData.push(row);
    }

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'APIResults.xlsx');
  }



}