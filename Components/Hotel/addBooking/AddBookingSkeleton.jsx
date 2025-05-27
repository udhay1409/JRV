import { Skeleton } from "@heroui/skeleton";
import { Card, Row, Col } from "react-bootstrap";

export default function AddBookingSkeleton() {
  return (
    <section className="container-fluid py-5 bg-light">
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Skeleton className="h-8 w-48" />
          </div>

          {/* Personal Information Section */}
          <Row className="g-3">
            {[...Array(8)].map((_, index) => (
              <Col md={6} key={`personal-${index}`}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </Col>
            ))}
          </Row>

          <hr className="my-4" />

          {/* Date Selection Section */}
          <Row className="g-3">
            {[...Array(2)].map((_, index) => (
              <Col md={6} key={`date-${index}`}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-full" />
              </Col>
            ))}
          </Row>

          {/* Room Selection Section */}
          {[...Array(2)].map((_, roomIndex) => (
            <Card key={`room-${roomIndex}`} className="mt-3 bg-light">
              <Card.Body>
                <Row className="g-3">
                  {[...Array(3)].map((_, fieldIndex) => (
                    <Col md={4} key={`room-field-${fieldIndex}`}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}

          {/* Additional Information Section */}
          <Row className="mt-3">
            <Col md={6}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-32 w-full" />
            </Col>
            <Col md={6}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-32 w-full" />
            </Col>
          </Row>

          {/* File Upload Section */}
          <Row className="mt-3">
            <Col md={6}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-40 w-full" />
            </Col>
            <Col md={6}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-40 w-full" />
            </Col>
          </Row>

          {/* Payment Method Section */}
          <Row className="mt-3">
            <Col md={6}>
              <Skeleton className="h-4 w-24 mb-2" />
              <div className="d-flex gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
            </Col>
          </Row>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end mt-4 gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </Card.Body>
      </Card>
    </section>
  );
}
