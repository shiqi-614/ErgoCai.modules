import app.freerouting.Freerouting;
import app.freerouting.core.RoutingJob;
import app.freerouting.core.RoutingJobState;
import app.freerouting.management.RoutingJobScheduler;
import app.freerouting.management.SessionManager;
import app.freerouting.settings.GlobalSettings;
import app.freerouting.settings.RouterSettings;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * Headless Freerouting driver: like the built-in CLI (-de/-do), but with RouterSettings sized to the board's
 * layer count -- the 2.0 CLI builds them with 0 layers and routes nothing ("p_layer out of range").
 * Build: javac -cp freerouting-executable.jar -d fr FrRoute.java
 * Run:   java -cp freerouting-executable.jar:fr FrRoute in.dsn out.ses <maxPasses> [viaCosts]
 */
public class FrRoute {
  public static void main(String[] a) throws Exception {
    GlobalSettings.setUserDataPath(Path.of(System.getProperty("java.io.tmpdir"), "freerouting-headless"));
    Freerouting.globalSettings = new GlobalSettings();
    var session = SessionManager.getInstance().createSession(UUID.randomUUID(), "Freerouting/headless");
    RoutingJob job = new RoutingJob(session.id);
    job.setInput(a[0]);
    session.addJob(job);
    File out = new File(a[1]);
    if (out.exists()) out.delete();
    job.tryToSetOutputFile(out);
    RouterSettings rs = new RouterSettings(job.input.statistics.layerCount);
    rs.maxPasses = Integer.parseInt(a[2]);
    if (a.length > 3) rs.set_via_costs(Integer.parseInt(a[3]));
    job.routerSettings = rs;
    job.state = RoutingJobState.READY_TO_START;
    RoutingJobScheduler.getInstance();
    while (job.state != RoutingJobState.COMPLETED && job.state != RoutingJobState.TERMINATED
           && job.state != RoutingJobState.CANCELLED && job.state != RoutingJobState.TIMED_OUT) {
      Thread.sleep(500);
    }
    System.out.println("job state: " + job.state);
    if (job.state == RoutingJobState.COMPLETED) {
      Files.write(out.toPath(), job.output.getData().readAllBytes());
      System.out.println("wrote " + out);
    }
    System.exit(0);
  }
}
