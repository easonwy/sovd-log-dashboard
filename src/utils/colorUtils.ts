export const getColorClass = (key: string): string => {
  switch (key) {
    case 'ERROR': return 'bg-red-500';
    case 'WARN': return 'bg-yellow-500';
    case 'INFO': return 'bg-blue-500';
    case 'SUCCESS': return 'bg-green-500';
    case 'VEHICLE_OWNER': return 'bg-sky-500';
    case 'DIAGNOSIS_PLATFORM': return 'bg-orange-500';
    case 'SOVD_CLIENT': return 'bg-fuchsia-500';
    case 'HMI': return 'bg-lime-500';
    case 'AUTH_SERVER': return 'bg-purple-500';
    case 'CDA': return 'bg-teal-500';
    case 'PRIVATE_SERVER': return 'bg-pink-500';
    case 'SOVD_GATEWAY': return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
};