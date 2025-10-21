import { MapComponent } from '@/components/map-component';
import { getMockUsers, getMockCurrentUser } from '@/lib/data';

export default function MapPage() {
  const users = getMockUsers();
  const currentUser = getMockCurrentUser();
  
  return (
    <div className="h-full w-full">
      <MapComponent users={users} currentUser={currentUser}/>
    </div>
  );
}
