"use client";
import React from "react";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "@/lib/firebase";

const TestPage = () => {
  // const [users, setUsers] = useState<any[]>([]);

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     const usersRef = collection(db, "users");
  //     const q = query(usersRef, where("role", "==", "user"));
  //     const querySnapshot = await getDocs(q);
  //     const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  //     setUsers(usersList);
      
  //     // Delete all users from the users list in Firebase
  //     // await Promise.all(usersList.map(user => deleteDoc(doc(usersRef, user.id))));
  //   };

  //   fetchUsers();
  // }, []);

  // const downloadJson = () => {
  //   const json = JSON.stringify(users, null, 2);
  //   const blob = new Blob([json], { type: "application/json" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "UsersList3/2/25.json";
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  return (
    <div>
      {/* <h1>Users with Role 'User'</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
      <button onClick={downloadJson}>Download JSON</button> */}
    </div>
  );
};

export default TestPage;
