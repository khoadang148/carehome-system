const fs = require('fs');
const path = require('path');

// Danh sách các API methods cần thêm
const missingMethods = {
  'activitiesAPI': [
    'getParticipants',
    'addParticipant', 
    'removeParticipant',
    'getByStaffId',
    'getByActivityId'
  ],
  'staffAssignmentsAPI': [
    'getAllIncludingExpired',
    'getById',
    'getMyAssignments'
  ],
  'carePlanAssignmentsAPI': [
    'getById',
    'getByFamilyMemberId',
    'getByStatus',
    'updateStatus',
    'renew',
    'removePackage'
  ],
  'billsAPI': [
    'getByResidentId',
    'calculateTotal'
  ],
  'userAPI': [
    'getProfile',
    'getAuthProfile',
    'updateProfile',
    'changePassword'
  ]
};

// Template cho API method
const methodTemplate = (methodName, endpoint, params = '') => `
  ${methodName}: async (${params}) => {
    try {
      const response = await apiClient.${endpoint};
      return response.data;
    } catch (error) {
      console.error(\`Error in ${methodName}:\`, error);
      throw error;
    }
  },`;

// Đọc file API hiện tại
const apiPath = path.join(__dirname, 'src/lib/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Thêm các methods còn thiếu
Object.entries(missingMethods).forEach(([apiName, methods]) => {
  methods.forEach(method => {
    if (!apiContent.includes(`${method}: async`)) {
      // Tìm vị trí cuối của API object
      const apiPattern = new RegExp(`export const ${apiName} = \\{[\\s\\S]*?\\};`);
      const match = apiContent.match(apiPattern);
      
      if (match) {
        const apiBlock = match[0];
        const newMethod = methodTemplate(method, 'get(\'/' + method.toLowerCase() + '\')');
        const updatedBlock = apiBlock.replace(/};$/, `${newMethod}\n};`);
        apiContent = apiContent.replace(apiPattern, updatedBlock);
      }
    }
  });
});

// Ghi lại file
fs.writeFileSync(apiPath, apiContent);

console.log('✅ Đã thêm các API methods còn thiếu');
console.log('🔄 Bây giờ hãy chạy: npm run build');
