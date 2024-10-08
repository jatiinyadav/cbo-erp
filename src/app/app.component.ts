import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

interface ApiResponse {
  type: string,
  mentionText: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'compsnippets';
  selectedFile: File | null = null;
  fetching = false;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.selectedFile = target.files[0];
    }
  }

  uploadDocument() {
    this.fetching = true;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1]!; // Extract Base64 content
        this.makeApiCall(base64String);
      };
    } else {
      console.log('No file selected');
    }
  }

  makeApiCall(base64String: string) {
    const apiUrl = 'https://documentai.googleapis.com/v1/projects/hardy-album-437408-b2/locations/us/processors/311e01813fd54474:process';
    const requestBody = {
      rawDocument: {
        content: base64String,
        mimeType: this.getMimeType(this.selectedFile!.name), // Get the mime type based on file name
      },
    };

    const token = "ya29.c.c0ASRK0GYz2Cco66lGzyr4TQaiYH1kqO6POmyOXda0vsSErCQUgGnntZ81WBMxh3HWuaDMrUqpUd3nTfdgMM9SEErJbTDRoZvEcec_lKFXQeAXd52w3LTLMffCgM7BSBRxoNGc6GEw1GS7Owa0Q3AHnBDx0NDke7hQ6YymebQwVo0OCIAkarwRhIJbd8SvYIeBKaKEmuJ5snzIvU2bdRzZSzz5WxYjXUUjFF24fNTQbFK1CXoOCjhnvZixGzfEMoMlUWuTTGhbojToEQ_l1j0ZlSyAdmggZy70OU4FpO0dh7V-euOMNu0CiQKrmXWQkxenGIeqljn_7emPQjRIiucgWtpxG6ZsaTMYS9R_fUSkcBvoIHz2z49wQk-CqsyLZBI3USB4EgN399Pau3ev3mMx79nimrt8Fh87ytlXfk6q0Vvcu-fZn61V9-BknzmUOshbguB4FWZ8y2uOrtkght0seq0V3dSa2btUlj-j_eXU1eakaRbd--n6Fo9iVhUdVSccr7ywM3gelW18iVuY5FBi6p4SQVqfvI5Utzup_vpaexd_i35Y-6uXcMjlBzuWF1y3dJa2yFhySjORz03sccjQ9a-brdlc_hxbwX45iWqocliWweks7WQU81skayS0w747w751V7kwr09gdrxur3Yxz486Zcg8feFufvoIS9d9cFvamjxhj9OOIx3ooxMyqO912QS26Uku9X4dhlekOUqdB6hi_7z123SvZSrFiY6O4kwMceIrl-4VXdYRS-yoFg9hsff79hWtQR8eJy9driVfZfBcxb8dgdzbB1jV4Ox_aWbR1SFufe0B0W5tBu0ue5RY_zlVS2fU1ce1Weq8hV3l_uX8RIZ2QWlqFwUBJ55sw45ja3nBR2gtydWhl47-UkmR98nnchh5mequiMBi75xidIMkfmFIrViJdk5V4Xg9nVFV5SvpcBajyYdspV6sOmak_b5h8VUoeQYiO0O0rMfgqyxe3ttBFBmJxtyhgJ_aesYRcJneM_qs5x5"
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    this.http.post(apiUrl, requestBody, {headers}).subscribe(
      (response: any) => {
        this.fetching = false
        console.log('API Response:', response.document.entities);
        this.downloadAsExcel(response.document.entities)
      },
      (error) => {
        console.error('Error:', error);
      }
    );
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
      if (!dataMap[obj.type]) {
        dataMap[obj.type] = [];
      }
      dataMap[obj.type].push(obj.mentionText);
    });

    const columns = Object.keys(dataMap);
    const maxRows = Math.max(...columns.map(col => dataMap[col].length));

    const worksheetData: any[][] = [];
    worksheetData.push(columns);

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      const row: any[] = [];
      columns.forEach(col => {
        row.push(dataMap[col][rowIndex] || '');
      });
      worksheetData.push(row);
    }

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'APIResults.xlsx');
  }
}