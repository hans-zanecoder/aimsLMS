'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus, UserPlus } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  enrolledStudents: string[];
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  enrolledCourses?: string[];
}

interface CheckedState {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/instructors/available-students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Transform the data to match the User interface
      const transformedStudents = data.students.map((student: any) => ({
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        role: 'student',
        status: student.status || 'Active',
        createdAt: student.createdAt,
        enrolledCourses: student.coursesEnrolled || []
      }));
      
      setStudents(transformedStudents);
      setCourses(data.courses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive'
      });
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedCourse) {
      toast({
        title: 'Error',
        description: 'Please select a course',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/instructors/courses/${selectedCourse}/batch-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentIds: selectedStudents
        })
      });

      const data = await response.json();

      if (data.success.length > 0) {
        toast({
          title: 'Success',
          description: `Assigned ${data.success.length} students to the course`
        });
        fetchStudents(); // Refresh the list
      }

      if (data.failed.length > 0) {
        toast({
          title: 'Warning',
          description: `Failed to assign ${data.failed.length} students`,
          variant: 'destructive'
        });
      }

      setShowAssignDialog(false);
      setSelectedStudents([]);
      setSelectedCourse('');
    } catch (error) {
      console.error('Error assigning students:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign students to course',
        variant: 'destructive'
      });
    }
  };

  const handleCheckboxChange = (checked: boolean, studentId: string) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s._id));
    } else {
      setSelectedStudents([]);
    }
  };

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students Management</h1>
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Assign to Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Students to Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                {selectedStudents.length > 0 && (
                  <p className="mb-2 text-sm text-gray-500">
                    {selectedStudents.length} students selected
                  </p>
                )}
                {filteredStudents.map(student => (
                  <div key={student._id} className="flex items-center space-x-2 py-2">
                    <Checkbox
                      checked={selectedStudents.includes(student._id)}
                      onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, student._id)}
                    />
                    <label className="text-sm">
                      {student.firstName} {student.lastName} ({student.email})
                    </label>
                  </div>
                ))}
              </div>
              <Button onClick={handleAssignStudents} className="w-full">
                Assign Selected Students
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedStudents.length === filteredStudents.length}
                  onCheckedChange={handleSelectAllChange}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled Courses</TableHead>
              <TableHead>Join Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student._id)}
                      onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, student._id)}
                    />
                  </TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      student.status === 'Active' ? 'bg-green-100 text-green-800' :
                      student.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell>{student.enrolledCourses?.length || 0} courses</TableCell>
                  <TableCell>
                    {new Date(student.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 